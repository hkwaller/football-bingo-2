import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

/** The app's bridge view controller. */
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        // Edge swipe goes back through the web history, like Safari.
        webView?.allowsBackForwardNavigationGestures = true
        // Capacitor turns off the web view's bounce while building it, so a page
        // that scrolls the document (not an inner overflow panel) felt dead.
        webView?.scrollView.bounces = true
    }
}
