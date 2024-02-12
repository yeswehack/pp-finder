package burp

import PPCommand
import burp.api.montoya.MontoyaApi
import burp.api.montoya.http.message.responses.HttpResponse
import burp.api.montoya.logging.Logging
import burp.api.montoya.proxy.http.InterceptedResponse
import burp.api.montoya.proxy.http.ProxyResponseHandler
import burp.api.montoya.proxy.http.ProxyResponseReceivedAction
import burp.api.montoya.proxy.http.ProxyResponseToBeSentAction
import java.net.URL


class JavascriptFileProxyResponseHandler(
    private var api: MontoyaApi,
    private var fileMatcher: CompilableFileMatcher,
    private var settings: Settings,
    private var shittyServerPort: Int
) : ProxyResponseHandler {
    private var logging: Logging = this.api.logging();

    private fun ppFinder(source: List<Byte>, filename: String, reportUrl: String): String? {
        return PPCommand(api, settings.nodePath, settings.ppFinderPath).pp(source, filename, reportUrl);
    }

    private fun getReportUrl(compiledFileUrl: String): String {
        return "http://127.0.0.1:$shittyServerPort${Constants.BASE_REQUEST_HANDLER_PATH}/view?url=$compiledFileUrl"
    }

    override fun handleResponseReceived(response: InterceptedResponse?): ProxyResponseReceivedAction {
        return ProxyResponseReceivedAction.continueWith(response);
    }

    override fun handleResponseToBeSent(response: InterceptedResponse?): ProxyResponseToBeSentAction {
        val contentTypeHeader = response?.headers()?.find { it.name().lowercase() == "content-type" }

        val contentType = contentTypeHeader?.value() ?: return ProxyResponseToBeSentAction.continueWith(response);

        val initialRequest = response.initiatingRequest();
        val hostHeader = initialRequest?.headers()?.find { it.name().lowercase() == "host" }?.value()
        if (initialRequest.path().startsWith(Constants.BASE_REQUEST_HANDLER_PATH) && hostHeader == "burp") {
            return ProxyResponseToBeSentAction.continueWith(RequestHandler(api, initialRequest, response).process());
        }

        val match = this.fileMatcher.match(contentType, initialRequest, this.api.scope());
        if (!match) {
            return ProxyResponseToBeSentAction.continueWith(response);
        }

        val filename = initialRequest?.path().toString();
        val fullUrl = initialRequest.url().toString();

        this.logging.logToOutput("Handling response from $filename, $fullUrl");

        val source = response.body()?.bytes?.toList()
            ?: return ProxyResponseToBeSentAction.continueWith(response);

        val reportUrl = getReportUrl(fullUrl);

        val result = ppFinder(source, filename, reportUrl) ?: return ProxyResponseToBeSentAction.continueWith(response);

        // Create new response
        var newResponse = HttpResponse.httpResponse(response.toByteArray());
        for (header in response.headers()) {
            newResponse = newResponse.withUpdatedHeader(header);
        }

        newResponse = newResponse.withBody(result);

        val compiledFileLength = result.length
        val sourceLength = source.size

        newResponse.withUpdatedHeader("Content-Length", "$compiledFileLength");

        this.logging.logToOutput("Compiled source size $filename.compiled: $compiledFileLength bytes (initially: $sourceLength) bytes");

        return ProxyResponseToBeSentAction.continueWith(newResponse);
    }
}