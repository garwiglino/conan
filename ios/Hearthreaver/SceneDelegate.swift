import UIKit

// Une seule fenêtre plein écran qui contient le jeu.
final class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.backgroundColor = .hearthreaverInk
        window.rootViewController = GameViewController()
        window.makeKeyAndVisible()
        self.window = window
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        (window?.rootViewController as? GameViewController)?.enforceLandscape()
    }

    // L'app passe en arrière-plan : le jeu se met en pause tout seul (comme dans Safari)
    // et on lui demande en plus d'enregistrer la partie tout de suite.
    func sceneDidEnterBackground(_ scene: UIScene) {
        (window?.rootViewController as? GameViewController)?.saveNow()
    }
}
