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

    /// Vrai si une version du jeu est disponible sur l'iPhone (téléchargée ou livrée avec l'app).
    static var hasLocalGame: Bool {
        let bundled = (Bundle.main.resourceURL ?? Bundle.main.bundleURL).appendingPathComponent("Game/index.html")
        return FileManager.default.fileExists(atPath: gameFile.path) || FileManager.default.fileExists(atPath: bundled.path)
    }

    private let session: URLSession
    private let directory: URL
    private let remote: URL
    private var requestID: UUID?
    private var completion: ((Bool) -> Void)?
    private var updateReady: (() -> Void)?

    var isChecking: Bool { requestID != nil }

    init(session: URLSession = .shared, directory: URL = GameUpdater.folder,
         remoteURL: URL = GameUpdater.remoteURL) {
        self.session = session
        self.directory = directory
        self.remote = remoteURL
    }

    /// `completion` est appelé une seule fois, sur le fil principal : quand la vérification est finie,
    /// ou au bout de `wait` secondes. Une mise à jour reçue ensuite déclenche
    /// `onUpdateReady`, sans interrompre la partie qui a déjà commencé.
    func check(wait: TimeInterval, onUpdateReady: (() -> Void)? = nil,
               completion: @escaping (Bool) -> Void) {
        precondition(Thread.isMainThread)
        guard !isChecking else { completion(false); return }
        let id = UUID()
        requestID = id
        self.completion = completion
        updateReady = onUpdateReady
        // Le jeu autonome dépasse 30 Mo : une connexion lente peut prendre
        // plus que l'attente de lancement, sans justifier l'abandon du transfert.
        var request = URLRequest(url: remote, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 120)
        let game = directory.appendingPathComponent("index.html")
        let etagFile = directory.appendingPathComponent("etag.txt")
        if FileManager.default.fileExists(atPath: game.path),
           let etag = try? String(contentsOf: etagFile, encoding: .utf8), !etag.isEmpty {
            request.setValue(etag, forHTTPHeaderField: "If-None-Match")
        }
        session.dataTask(with: request) { data, response, _ in
            let updated = self.store(data: data, response: response)
            DispatchQueue.main.async {
                guard self.requestID == id else { return }
                self.requestID = nil
                let ready = self.updateReady
                self.updateReady = nil
                if self.completion != nil { self.finish(updated) }
                else if updated { ready?() }
            }
        }.resume()
        DispatchQueue.main.asyncAfter(deadline: .now() + max(0, wait)) { [weak self] in
            guard self?.requestID == id else { return }
            self?.finish(false)
        }
    }

    private func finish(_ updated: Bool) {
        guard let completion else { return }
        self.completion = nil
        completion(updated)
    }

    /// Range la nouvelle version si la réponse est un jeu complet et compatible (même clé de sauvegarde).
    private func store(data: Data?, response: URLResponse?) -> Bool {
        guard let http = response as? HTTPURLResponse, http.statusCode == 200,
              let data, Self.isValidGame(data) else { return false }
        let fm = FileManager.default
        let gameFile = directory.appendingPathComponent("index.html")
        let etagFile = directory.appendingPathComponent("etag.txt")
        let etag = http.value(forHTTPHeaderField: "ETag")
        if fm.fileExists(atPath: gameFile.path) {
            if let etag, let previous = try? String(contentsOf: etagFile, encoding: .utf8), previous == etag { return false }
            if etag == nil, let previous = try? Data(contentsOf: gameFile, options: .mappedIfSafe), previous == data { return false }
        }
        try? fm.createDirectory(at: directory, withIntermediateDirectories: true)
        var dir = directory
        var noBackup = URLResourceValues()
        noBackup.isExcludedFromBackup = true // re-téléchargeable : inutile dans la sauvegarde iCloud
        try? dir.setResourceValues(noBackup)
        do {
            try data.write(to: gameFile, options: .atomic)
            if let etag {
                try? etag.write(to: etagFile, atomically: true, encoding: .utf8)
            } else { try? fm.removeItem(at: etagFile) }
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
