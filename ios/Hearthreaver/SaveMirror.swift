import Foundation
import WebKit

/// Double sécurité pour la progression.
/// Le jeu enregistre dans le localStorage du moteur web, comme sur le site. Chaque écriture est aussi copiée
/// dans un fichier de l'app (sauvegardé par iCloud avec l'iPhone) ; au lancement, ce qui manquerait côté web
/// est restauré depuis ce fichier avant que le jeu ne démarre.
final class SaveMirror: NSObject, WKScriptMessageHandler {

    static let channel = "conanStore"

    private let fileURL: URL
    private var values: [String: String]
    private let writer = DispatchQueue(label: "conan.saves", qos: .utility)

    override init() {
        let fm = FileManager.default
        let dir = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        fileURL = dir.appendingPathComponent("sauvegarde-conan.json")
        if let data = try? Data(contentsOf: fileURL),
           let stored = try? JSONDecoder().decode([String: String].self, from: data) {
            values = stored
        } else {
            values = [:]
        }
        super.init()
    }

    /// Script injecté avant le jeu : app = mode « écran d'accueil » (le bouton plein écran du site est masqué),
    /// restauration de la sauvegarde si besoin, puis copie de chaque écriture du localStorage vers l'app.
    func bootstrapScript() -> String {
        let json = (try? JSONEncoder().encode(values)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        return """
        (function () {
          try { Object.defineProperty(Navigator.prototype, 'standalone', { configurable: true, get: function () { return true; } }); } catch (e) {}
          var ls;
          try { ls = window.localStorage; } catch (e) { return; }
          var saved = \(json);
          try { for (var k in saved) { if (ls.getItem(k) === null) ls.setItem(k, saved[k]); } } catch (e) {}
          var post = function (m) { try { window.webkit.messageHandlers.\(SaveMirror.channel).postMessage(m); } catch (e) {} };
          var S = Storage.prototype, set = S.setItem, rem = S.removeItem, clr = S.clear;
          S.setItem = function (k, v) { set.apply(this, arguments); if (this === ls) post({ op: 'set', key: String(k), value: String(v) }); };
          S.removeItem = function (k) { rem.apply(this, arguments); if (this === ls) post({ op: 'remove', key: String(k) }); };
          S.clear = function () { clr.apply(this, arguments); if (this === ls) post({ op: 'clear' }); };
        })();
        """
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let op = body["op"] as? String else { return }
        switch op {
        case "set":
            guard let key = body["key"] as? String, let value = body["value"] as? String else { return }
            values[key] = value
        case "remove":
            guard let key = body["key"] as? String else { return }
            values.removeValue(forKey: key)
        case "clear":
            values.removeAll()
        default:
            return
        }
        let snapshot = values
        let url = fileURL
        writer.async {
            if let data = try? JSONEncoder().encode(snapshot) {
                try? data.write(to: url, options: .atomic)
            }
        }
    }
}
