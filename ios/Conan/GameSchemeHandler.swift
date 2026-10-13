import Foundation
import UniformTypeIdentifiers
import WebKit

/// Sert les fichiers du dossier « Game » de l'app sous l'adresse conan://localhost/…
/// Tout est local : le jeu fonctionne sans réseau.
final class GameSchemeHandler: NSObject, WKURLSchemeHandler {

    static let scheme = "conan"
    static let startURL = URL(string: "conan://localhost/index.html")!

    private let root: URL = (Bundle.main.resourceURL ?? Bundle.main.bundleURL)
        .appendingPathComponent("Game", isDirectory: true)
        .standardizedFileURL

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL

        guard file.path.hasPrefix(root.path + "/"), let data = try? Data(contentsOf: file) else {
            let missing = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: ["Content-Length": "0"])!
            urlSchemeTask.didReceive(missing)
            urlSchemeTask.didFinish()
            return
        }

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
