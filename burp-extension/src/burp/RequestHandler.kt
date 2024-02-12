package burp

import burp.api.montoya.MontoyaApi
import burp.api.montoya.http.message.HttpHeader
import burp.api.montoya.http.message.requests.HttpRequest
import burp.api.montoya.http.message.responses.HttpResponse
import java.net.URL
import java.net.URLDecoder


class RequestHandler (private val api: MontoyaApi, private val initialRequest: HttpRequest, private val initialResponse: HttpResponse){
    private fun handleSplitView(): HttpResponse {
        val classLoader = Settings::class.java.classLoader
        val resourceStream = classLoader.getResourceAsStream("view.html")
        val content = resourceStream?.bufferedReader().use { it?.readText() }
        return initialResponse.withBody(content).withUpdatedHeader(HttpHeader.httpHeader("Content-Type", "text/html")).withStatusCode(200)
    }

    private fun handleDownloadFile(url: URL): HttpResponse {
        val urlParam = URLDecoder.decode(url.query.split("url=").last(), "utf-8")
        // Search the burp history for the last response'd javascript file
        for (requestResponse in api.proxy().history()) {
            val candidateUrl = requestResponse.finalRequest().url()
            val body = requestResponse.originalResponse().body()
            if (candidateUrl == urlParam && body.length() > 0) {
                return initialResponse
                    .withBody(body)
                    .withStatusCode(200)
                    .withUpdatedHeader(HttpHeader.httpHeader("Content-Type", "text/javascript"))
                    .withUpdatedHeader(HttpHeader.httpHeader("Content-Security-Policy"))
            }
        }

        return initialResponse.withBody("not found").withStatusCode(404)
    }

    fun process(): HttpResponse {
        val rawUrl = initialRequest.url()
        val url = URL(rawUrl)

        this.api.logging().logToOutput("URL matcher '$rawUrl' path: '${url.path}'")

        val path = url.path
        return when (path) {
            "${Constants.BASE_REQUEST_HANDLER_PATH}/view" -> handleSplitView()
            "${Constants.BASE_REQUEST_HANDLER_PATH}/download-file" -> handleDownloadFile(url)
            else -> {
                return initialResponse;
            }
        }
    }
}