import UserNotifications
import WebKit

/// Notification locale « Arrivé à destination ».
/// Le jeu la programme quand l'app passe en arrière-plan pendant un voyage, à l'heure d'arrivée prévue,
/// et l'annule dès que l'on revient dans l'app. L'autorisation est demandée au premier départ en voyage.
final class TravelNotifications: NSObject, WKScriptMessageHandler {

    static let channel = "hearthreaverTravel"
    private static let identifier = "hearthreaver-arrival"
    private let center = UNUserNotificationCenter.current()

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              message.frameInfo.request.url?.scheme == GameSchemeHandler.scheme,
              message.frameInfo.request.url?.host == "localhost",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }
        switch action {
        case "authorize":
            authorize()
        case "schedule":
            guard let delay = (body["delay"] as? NSNumber)?.doubleValue, delay.isFinite else { return }
            schedule(after: delay,
                     title: String((body["title"] as? String ?? "Arrivé à destination").prefix(80)),
                     text: String((body["body"] as? String ?? "").prefix(200)))
        case "cancel":
            cancel()
        default:
            return
        }
    }

    /// La fenêtre système n'apparaît qu'une fois ; un refus est respecté et le jeu continue sans notification.
    private func authorize() {
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .notDetermined else { return }
            self.center.requestAuthorization(options: [.alert, .sound]) { _, _ in }
        }
    }

    private func schedule(after delay: TimeInterval, title: String, text: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = text
        content.sound = .default
        // Au plus une notification de voyage : la nouvelle remplace la précédente (même identifiant).
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: min(max(1, delay), 24 * 3600), repeats: false)
        center.add(UNNotificationRequest(identifier: Self.identifier, content: content, trigger: trigger)) { _ in }
    }

    /// Retour dans l'app : le jeu affiche lui-même l'arrivée, la notification n'a plus lieu d'être.
    private func cancel() {
        center.removePendingNotificationRequests(withIdentifiers: [Self.identifier])
        center.removeDeliveredNotifications(withIdentifiers: [Self.identifier])
    }
}
