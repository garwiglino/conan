import Foundation

final class MockProtocol: URLProtocol {
    static var reply: (URLRequest) throws -> (TimeInterval, Int, Data, String?) = { _ in
        throw URLError(.notConnectedToInternet)
    }
    private var pending: DispatchWorkItem?
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            let (delay, status, data, etag) = try Self.reply(request)
            let item = DispatchWorkItem { [weak self] in
                guard let self else { return }
                let headers = etag.map { ["ETag": $0] } ?? [:]
                let response = HTTPURLResponse(url: self.request.url!, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!
                self.client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
                self.client?.urlProtocol(self, didLoad: data)
                self.client?.urlProtocolDidFinishLoading(self)
            }
            pending = item
            DispatchQueue.global().asyncAfter(deadline: .now() + delay, execute: item)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
    override func stopLoading() { pending?.cancel() }
}

func require(_ value: @autoclosure () throws -> Bool, _ message: String) {
    do { if try !value() { fatalError(message) } }
    catch { fatalError("\(message): \(error)") }
}
func pump(_ seconds: TimeInterval) {
    let end = Date().addingTimeInterval(seconds)
    while Date() < end { RunLoop.current.run(until: Date().addingTimeInterval(0.005)) }
}
func until(_ done: () -> Bool) {
    let end = Date().addingTimeInterval(5)
    while !done() && Date() < end { pump(0.005) }
    require(done(), "Network callback did not complete")
}
func game(_ revision: String) -> Data {
    Data(("<html><canvas></canvas><script>const key='conan-serpent-v1';/*" + revision + String(repeating: " ", count: 500_001) + "*/</script></html>").utf8)
}
let old = game("old"), fresh = game("fresh")
var passed = 0
func scenario(_ name: String, _ run: (GameUpdater, URL) throws -> Void) throws {
    let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    defer { try? FileManager.default.removeItem(at: folder) }
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [MockProtocol.self]
    let session = URLSession(configuration: config)
    defer { session.invalidateAndCancel() }
    let updater = GameUpdater(session: session, directory: folder)
    try run(updater, folder)
    passed += 1
    print("PASS: \(name)")
}

try scenario("a fast valid update is stored before launching, with one completion") { updater, folder in
    MockProtocol.reply = { request in
        require(request.url == GameUpdater.remoteURL, "The historical update URL changed")
        require(request.timeoutInterval >= 120, "Large downloads still time out too early")
        return (0.01, 200, fresh, "v2")
    }
    var calls = 0, late = 0
    updater.check(wait: 0.2, onUpdateReady: { late += 1 }) { updated in
        require(updated, "Fast update was not launched")
        calls += 1
    }
    until { !updater.isChecking }
    require(try Data(contentsOf: folder.appendingPathComponent("index.html")) == fresh, "Wrong cached game")
    pump(0.25)
    require(calls == 1 && late == 0, "Completion or prompt delivered twice")
}
try scenario("a slow update launches the old copy once, then announces the new copy") { updater, folder in
    try old.write(to: folder.appendingPathComponent("index.html"))
    MockProtocol.reply = { _ in (0.1, 200, fresh, "v2") }
    var calls = 0, late = 0
    updater.check(wait: 0.01, onUpdateReady: { late += 1 }) { updated in
        require(!updated && updater.isChecking, "Fallback cancelled the download")
        require((try? Data(contentsOf: folder.appendingPathComponent("index.html"))) == old, "Fallback copy was lost")
        calls += 1
    }
    until { !updater.isChecking }
    require(calls == 1 && late == 1, "Late update was silently discarded")
    require(try Data(contentsOf: folder.appendingPathComponent("index.html")) == fresh, "Late game was not installed")
}
try scenario("304 keeps the cached game and sends its ETag") { updater, folder in
    try old.write(to: folder.appendingPathComponent("index.html"))
    try "v1".write(to: folder.appendingPathComponent("etag.txt"), atomically: true, encoding: .utf8)
    MockProtocol.reply = { request in
        require(request.value(forHTTPHeaderField: "If-None-Match") == "v1", "ETag not sent")
        return (0.03, 304, Data(), "v1")
    }
    var late = 0
    updater.check(wait: 0, onUpdateReady: { late += 1 }) { updated in require(!updated, "304 treated as update") }
    until { !updater.isChecking }
    require(try Data(contentsOf: folder.appendingPathComponent("index.html")) == old, "304 erased the cache")
    require(late == 0, "Unchanged game announced")
}
for status in [200, 500] {
    try scenario("HTTP \(status) with an incomplete game cannot replace the working copy") { updater, folder in
        try old.write(to: folder.appendingPathComponent("index.html"))
        try "v1".write(to: folder.appendingPathComponent("etag.txt"), atomically: true, encoding: .utf8)
        MockProtocol.reply = { _ in (0.01, status, Data("<html>incomplete</html>".utf8), "v2") }
        updater.check(wait: 1, onUpdateReady: { fatalError("Invalid game announced") }) { require(!$0, "Invalid game accepted") }
        until { !updater.isChecking }
        require(try Data(contentsOf: folder.appendingPathComponent("index.html")) == old, "Working copy corrupted")
        require(try String(contentsOf: folder.appendingPathComponent("etag.txt"), encoding: .utf8) == "v1", "Invalid response advanced ETag")
    }
}
try scenario("offline launch preserves the working copy") { updater, folder in
    try old.write(to: folder.appendingPathComponent("index.html"))
    MockProtocol.reply = { _ in throw URLError(.notConnectedToInternet) }
    updater.check(wait: 1, onUpdateReady: { fatalError("Offline update announced") }) { require(!$0, "Offline response accepted") }
    until { !updater.isChecking }
    require(try Data(contentsOf: folder.appendingPathComponent("index.html")) == old, "Offline game lost")
}
try scenario("200 with the same ETag does not prompt on every foreground check") { updater, folder in
    try old.write(to: folder.appendingPathComponent("index.html"))
    try "v1".write(to: folder.appendingPathComponent("etag.txt"), atomically: true, encoding: .utf8)
    MockProtocol.reply = { _ in (0.02, 200, old, "v1") }
    var late = 0
    updater.check(wait: 0, onUpdateReady: { late += 1 }) { require(!$0, "Same game accepted as update") }
    until { !updater.isChecking }
    require(late == 0, "Same ETag prompted a reload")
}
try scenario("a completed request's old timer cannot finish the next foreground check") { updater, _ in
    MockProtocol.reply = { _ in (0.01, 200, old, "v1") }
    updater.check(wait: 0.12) { require($0, "Initial fast update failed") }
    until { !updater.isChecking }
    MockProtocol.reply = { _ in (0.25, 200, fresh, "v2") }
    var calls = 0
    updater.check(wait: 1) { require($0, "Old startup timer finished the newer request"); calls += 1 }
    pump(0.16)
    require(calls == 0 && updater.isChecking, "Old timer interrupted the active request")
    until { !updater.isChecking }
    require(calls == 1, "Foreground completion duplicated")
}
try scenario("overlapping checks do not replace the active download's callbacks") { updater, _ in
    MockProtocol.reply = { _ in (0.05, 200, fresh, "v2") }
    var first = 0, second = 0, late = 0
    updater.check(wait: 1, onUpdateReady: { late += 1 }) { require($0, "Active download lost"); first += 1 }
    updater.check(wait: 1) { require(!$0, "Duplicate request launched"); second += 1 }
    until { !updater.isChecking }
    require(first == 1 && second == 1 && late == 0, "Overlapping checks corrupted delivery")
}
print("\(passed) updater scenarios passed.")
