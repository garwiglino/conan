import UIKit
import WebKit

extension UIColor {
    /// Fond du jeu (#0e0b09), aussi utilisé au lancement pour éviter tout flash blanc.
    static let hearthreaverInk = UIColor(red: 14 / 255, green: 11 / 255, blue: 9 / 255, alpha: 1)
}

/// Affiche le jeu exact (Game/index.html, identique à la version web) dans un WKWebView plein écran.
/// Le moteur, le rendu, les sons, la musique et les commandes tactiles sont ceux du jeu : rien n'est réécrit.
final class GameViewController: UIViewController, WKNavigationDelegate {

    private var webView: WKWebView?
    private var saves: SaveMirror?

    // Plein écran natif : pas de barre d'état, barre d'accueil discrète,
    // et les gestes système sur les bords demandent un second glissement (pas de sortie accidentelle en jouant).
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        .landscapeRight
    }

    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .landscapeRight }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        enforceLandscape()
    }

    /// Keep the same landscape orientation regardless of the physical device pose.
    func enforceLandscape() {
        if #available(iOS 16.0, *) {
            setNeedsUpdateOfSupportedInterfaceOrientations()
            view.window?.windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: .landscapeRight)) { error in
                NSLog("Landscape request: %@", error.localizedDescription)
            }
        } else {
            UIViewController.attemptRotationToDeviceOrientation()
        }
    }

    override func loadView() {
        let saves = SaveMirror()
        self.saves = saves

        let config = WKWebViewConfiguration()
        // Les fichiers du jeu sont servis depuis l'app par conan://localhost/… (hors ligne, origine stable pour la sauvegarde).
        config.setURLSchemeHandler(GameSchemeHandler(), forURLScheme: GameSchemeHandler.scheme)
        config.ignoresViewportScaleLimits = false
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default()
        config.userContentController.addUserScript(
            WKUserScript(source: saves.bootstrapScript(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController.add(saves, name: SaveMirror.channel)
        config.userContentController.add(GameHaptics(), name: "hearthreaverHaptics")

        let web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = .hearthreaverInk
        web.scrollView.backgroundColor = .hearthreaverInk
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.scrollView.bouncesZoom = false
        web.scrollView.pinchGestureRecognizer?.isEnabled = false
        // Les marges de sécurité (encoche, barre d'accueil) restent gérées par le jeu via env(safe-area-inset-*).
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsLinkPreview = false
        web.allowsBackForwardNavigationGestures = false
        web.navigationDelegate = self
        #if DEBUG
        if #available(iOS 16.4, *) {
            web.isInspectable = true // inspection possible depuis Safari sur Mac (Développement › iPhone)
        }
        #endif

        webView = web
        view = web
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // Avant de lancer le jeu, on regarde s'il y a une nouvelle version (5 s au plus ; sans réseau, lancement immédiat).
        // Si l'app a été installée sans le jeu (projet allégé), le premier lancement le télécharge.
        let firstRun = !GameUpdater.hasLocalGame
        let status = UILabel()
        status.text = firstRun ? "TÉLÉCHARGEMENT DU JEU…" : "MISE À JOUR DU JEU…"
        status.textColor = UIColor(red: 241 / 255, green: 227 / 255, blue: 189 / 255, alpha: 1)
        status.font = .monospacedSystemFont(ofSize: 13, weight: .semibold)
        status.numberOfLines = 0
        status.textAlignment = .center
        status.alpha = 0
        status.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(status)
        NSLayoutConstraint.activate([
            status.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            status.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        UIView.animate(withDuration: 0.25, delay: firstRun ? 0 : 0.7, options: [], animations: { status.alpha = 1 })

        let updater = GameUpdater()
        updater.check(wait: firstRun ? 120 : 5) { [weak self] _ in
            guard GameUpdater.hasLocalGame else {
                status.alpha = 1
                status.text = "CONNEXION INTERNET NÉCESSAIRE\nAU PREMIER LANCEMENT.\n\nFERME ET ROUVRE L’APP."
                return
            }
            status.removeFromSuperview()
            self?.webView?.load(URLRequest(url: GameSchemeHandler.startURL))
        }
    }

    /// Déclenche l'enregistrement de la partie par le jeu lui-même (même fonction que lors de la fermeture d'une page web).
    func saveNow() {
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('hearthreaver-suspend'));true", completionHandler: nil)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false
    }

    // Si iOS ferme le moteur web en arrière-plan (mémoire), on recharge le jeu : la sauvegarde est reprise.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.load(URLRequest(url: GameSchemeHandler.startURL))
    }
}

/// Retours courts demandés par le jeu ; aucune vibration continue ni donnée externe.
private final class GameHaptics: NSObject, WKScriptMessageHandler {
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let impact = UIImpactFeedbackGenerator(style: .medium)
    private let selection = UISelectionFeedbackGenerator()
    private let notification = UINotificationFeedbackGenerator()
    private var last: [String: TimeInterval] = [:]

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              message.frameInfo.request.url?.scheme == GameSchemeHandler.scheme,
              message.frameInfo.request.url?.host == "localhost",
              UIApplication.shared.applicationState == .active,
              let kind = message.body as? String,
              ["ui", "hurt", "parry", "success"].contains(kind) else { return }
        let now = ProcessInfo.processInfo.systemUptime
        let cooldown: TimeInterval = kind == "success" ? 0.8 : kind == "ui" ? 0.09 : 0.2
        guard now - (last[kind] ?? -.infinity) >= cooldown else { return }
        last[kind] = now
        switch kind {
        case "hurt": impact.impactOccurred(intensity: 0.7); impact.prepare()
        case "parry": light.impactOccurred(intensity: 0.65); light.prepare()
        case "success": notification.notificationOccurred(.success); notification.prepare()
        default: selection.selectionChanged(); selection.prepare()
        }
    }
}
