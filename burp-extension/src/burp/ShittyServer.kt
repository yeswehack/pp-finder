package burp

import burp.api.montoya.MontoyaApi
import fi.iki.elonen.NanoHTTPD

//
//class OKHandler : HttpHandler {
//    @Throws(IOException::class)
//    override fun handle(exchange: HttpExchange) {
//        val response = "OK"
//        exchange.sendResponseHeaders(200, response.length.toLong())
//        val os: OutputStream = exchange.responseBody
//        os.write(response.toByteArray())
//        os.close()
//    }
//}
//
//class ViewHandler : HttpHandler {
//    @Throws(IOException::class)
//    override fun handle(exchange: HttpExchange) {
//        val classLoader = Settings::class.java.classLoader
//        val resourceStream = classLoader.getResourceAsStream("view.html")
//        val content = resourceStream?.bufferedReader().use { it?.readText() }.toString()
//
//        exchange.sendResponseHeaders(200, content.length.toLong())
//        exchange.responseHeaders.set("Content-Type", "text/html");
//        val os: OutputStream = exchange.responseBody
//        os.write(content.toByteArray())
//        os.close()
//    }
//}
//
//
//class DownloadHandler (private val api: MontoyaApi) : HttpHandler {
//    @Throws(IOException::class)
//    override fun handle(exchange: HttpExchange) {
//        val urlParam = URLDecoder.decode(exchange.requestURI.query.toString().split("url=").last(), "utf-8")
//
//        for (requestResponse in api.proxy().history()) {
//            val candidateUrl = requestResponse.finalRequest().url()
//            val body = requestResponse.originalResponse().body()
//            if (candidateUrl == urlParam && body.length() > 0) {
//
//                exchange.sendResponseHeaders(200, body.length().toLong())
//                exchange.responseHeaders.set("Content-Type", "text/plain");
//                val os: OutputStream = exchange.responseBody
//                os.write(body.bytes)
//                os.close()
//            }
//        }
//
//        exchange.sendResponseHeaders(404, 0)
//    }
//}


class ShittyServer(private val api: MontoyaApi, port: Int) : NanoHTTPD(port){
    init {
        start(SOCKET_READ_TIMEOUT, false)
        println("\nRunning! Point your browsers to http://localhost:8080/ \n")
    }

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri
        api.logging().logToOutput("URI: $uri")
        return newFixedLengthResponse("TOTO");
    }
}
