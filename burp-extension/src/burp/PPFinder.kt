package burp;

import burp.api.montoya.BurpExtension
import burp.api.montoya.MontoyaApi
import java.io.IOException
import java.net.ServerSocket

//Burp will auto-detect and load any class that extends BurpExtension.
@Suppress("unused")
class PPFinder : BurpExtension {
    private fun findFirstAvailablePort(): Int {
        try {
            ServerSocket(0).use { serverSocket ->
                return serverSocket.localPort
            }
        } catch (e: IOException) {
            throw RuntimeException("Failed to find an available port", e)
        }
    }
    @Override
    override fun initialize(api: MontoyaApi) {
        // set extension name
        api.extension().setName("PP-Finder Burp Extension");

        val port = findFirstAvailablePort()

        ShittyServer(api, port)

        val settings = Settings(api.logging())
        settings.loadPpFinder()
        settings.loadNode()

        val fileMatcher = CompilableFileMatcher(api.logging());

//        api.proxy().registerRequestHandler(JavascriptFileProxyRequestHandler(api, fileMatcher, settings))
        api.proxy().registerResponseHandler(JavascriptFileProxyResponseHandler(api, fileMatcher, settings, port))
    }
}
