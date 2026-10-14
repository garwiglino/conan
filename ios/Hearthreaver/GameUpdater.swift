import Foundation

/// Mise à jour à distance du jeu.
/// À chaque lancement, l'app demande à GitHub si index.html a changé (requête légère grâce à l'ETag).
/// Si oui, elle télécharge la nouvelle version et la range sur l'iPhone ; sinon, ou sans réseau,
/// elle lance la dernière version reçue (ou celle livrée avec l'app).
final class GameUpdater {

    static let remoteURL = URL(string: "https://raw.githubusercontent.com/garwiglino/conan/main/index.html")!

    /// Dossier de la dernière version téléchargée (prioritaire sur la copie livrée avec l'app).
    static var folder: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("JeuMisAJour", isDirectory: true)
    }
    private static var gameFile: URL { folder.appendingPathComponent("index.html") }
    private static var etagFile: URL { folder.appendingPathComponent("etag.txt") }

    /// Vrai si une version du jeu est disponible sur l'iPhone (téléchargée ou livrée avec l'app).
    static var hasLocalGame: Bool {
        let bundled = (Bundle.main.resourceURL ?? Bundle.main.bundleURL).appendingPathComponent("Game/index.html")
        return FileManager.default.fileExists(atPath: gameFile.path) || FileManager.default.fileExists(atPath: bundled.path)
    }

    private var completion: ((Bool) -> Void)?

    /// `completion` est appelé une seule fois, sur le fil principal : quand la vérification est finie,
    /// ou au bout de `wait` secondes. Dans ce cas le téléchargement continue et servira au lancement suivant.
    func check(wait: TimeInterval, completion: @escaping (Bool) -> Void) {
        self.completion = completion
        var request = URLRequest(url: Self.remoteURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30)
        if FileManager.default.fileExists(atPath: Self.gameFile.path),
           let etag = try? String(contentsOf: Self.etagFile, encoding: .utf8), !etag.isEmpty {
            request.setValue(etag, forHTTPHeaderField: "If-None-Match")
        }
        URLSession.shared.dataTask(with: request) { data, response, _ in
            let updated = Self.store(data: data, response: response)
            DispatchQueue.main.async { self.finish(updated) }
        }.resume()
        DispatchQueue.main.asyncAfter(deadline: .now() + wait) { self.finish(false) }
    }

    private func finish(_ updated: Bool) {
        guard let completion else { return }
        self.completion = nil
        completion(updated)
    }

    /// Range la nouvelle version si la réponse est un jeu complet et compatible (même clé de sauvegarde).
    private static func store(data: Data?, response: URLResponse?) -> Bool {
        guard let http = response as? HTTPURLResponse, http.statusCode == 200,
              let data, isValidGame(data) else { return false }
        let fm = FileManager.default
        try? fm.createDirectory(at: folder, withIntermediateDirectories: true)
        var dir = folder
        var noBackup = URLResourceValues()
        noBackup.isExcludedFromBackup = true // re-téléchargeable : inutile dans la sauvegarde iCloud
        try? dir.setResourceValues(noBackup)
        do {
            try data.write(to: gameFile, options: .atomic)
            if let etag = http.value(forHTTPHeaderField: "ETag") {
                try? etag.write(to: etagFile, atomically: true, encoding: .utf8)
            }
            return true
        } catch {
            return false
        }
    }

    private static func isValidGame(_ data: Data) -> Bool {
        guard data.count > 500_000, let text = String(data: data, encoding: .utf8) else { return false }
        return text.contains("conan-serpent-v1") && text.contains("<canvas") && text.suffix(64).contains("</html>")
    }
}
