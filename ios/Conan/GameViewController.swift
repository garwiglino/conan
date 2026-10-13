import UIKit
import WebKit

extension UIColor {
    /// Fond du jeu (#0e0b09), aussi utilisé au lancement pour éviter tout flash blanc.
    static let conanInk = UIColor(red: 14 / 255, green: 11 / 255, blue: 9 / 255, alpha: 1)
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
        UIDevice.current.userInterfaceIdiom == .pad ? .all : .allButUpsideDown
    }

    override func loadView() {
        let saves = SaveMirror()
        self.saves = saves

        let config = WKWebViewConfiguration()
        // Les fichiers du jeu sont servis depuis l'app par conan://localhost/… (hors ligne, origine stable pour la sauvegarde).
        config.setURLSchemeHandler(GameSchemeHandler(), forURLScheme: GameSchemeHandler.scheme)
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default()
        config.userContentController.addUserScript(
            WKUserScript(source: saves.bootstrapScript(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController.add(saves, name: SaveMirror.channel)

        let web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = .conanInk
        web.scrollView.backgroundColor = .conanInk
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
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
        let status = UILabel()
        status.text = "MISE À JOUR DU JEU…"
        status.textColor = UIColor(red: 241 / 255, green: 227 / 255, blue: 189 / 255, alpha: 1)
        status.font = .monospacedSystemFont(ofSize: 13, weight: .semibold)
        status.alpha = 0
        status.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(status)
        NSLayoutConstraint.activate([
            status.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            status.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        UIView.animate(withDuration: 0.25, delay: 0.7, options: [], animations: { status.alpha = 1 })

        let updater = GameUpdater()
        updater.check(wait: 5) { [weak self] _ in
            status.removeFromSuperview()
            self?.webView?.load(URLRequest(url: GameSchemeHandler.startURL))
        }
    }

    /// Déclenche l'enregistrement de la partie par le jeu lui-même (même fonction que lors de la fermeture d'une page web).
    func saveNow() {
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('pagehide'));true", completionHandler: nil)
    }

    // Si iOS ferme le moteur web en arrière-plan (mémoire), on recharge le jeu : la sauvegarde est reprise.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.load(URLRequest(url: GameSchemeHandler.startURL))
    }
}
