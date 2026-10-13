import Foundation
import UniformTypeIdentifiers
import WebKit

/// Sert le jeu sous l'adresse conan://localhost/… : d'abord la dernière version téléchargée (GameUpdater),
/// sinon la copie livrée avec l'app (dossier « Game »). Tout est local au moment de jouer : pas besoin de réseau.
final class GameSchemeHandler: NSObject, WKURLSchemeHandler {

    static let scheme = "conan"
    static let startURL = URL(string: "conan://localhost/index.html")!

    private let roots: [URL] = [
        GameUpdater.folder.standardizedFileURL,
        (Bundle.main.resourceURL ?? Bundle.main.bundleURL).appendingPathComponent("Game", isDirectory: true).standardizedFileURL
    ]

    private func load(_ relative: String) -> (URL, Data)? {
        for root in roots {
            let file = root.appendingPathComponent(relative).standardizedFileURL
            guard file.path.hasPrefix(root.path + "/") else { continue }
            if let data = try? Data(contentsOf: file) { return (file, data) }
        }
        return nil
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }

        guard let found = load(String(path.dropFirst())) else {
            let missing = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: ["Content-Length": "0"])!
            urlSchemeTask.didReceive(missing)
            urlSchemeTask.didFinish()
            return
        }
        let (file, data) = found

        var mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        if mime.hasPrefix("text/") || mime == "application/javascript" { mime += "; charset=utf-8" }
        let headers = ["Content-Type": mime, "Content-Length": String(data.count), "Cache-Control": "no-cache"]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}
