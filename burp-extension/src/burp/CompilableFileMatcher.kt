package burp

import burp.api.montoya.http.message.requests.HttpRequest
import burp.api.montoya.logging.Logging
import burp.api.montoya.scope.Scope

class CompilableFileMatcher(private var logging: Logging) {
    /**
     * Should support text/javascript; charset=utf-8
     * Should support application/javascript
     * Do I forget anything ?
     * etc
     */
    private fun matchContentType(contentType: String) : Boolean {

        val allowedContentTypes = arrayOf(
            "text/javascript",
            "application/javascript",
        );

        for (ct in allowedContentTypes) {
            if (contentType.contains(ct)) {
                return true;
            }
        }

        return false;
    }

    private fun matchUrl(url: String?) : Boolean {
        if (url == null) return false;
        val extension = url.substring(url.lastIndexOf(".") + 1);
        return extension == "js";
    }

    fun match(contentType: String, initialRequest: HttpRequest?, scope: Scope): Boolean {
        val url = initialRequest?.url();
        val match = this.matchContentType(contentType) && this.matchUrl(url) && scope.isInScope(url);
        if (match) {
            this.logging.logToOutput("File $url, Content-Type: $contentType");
        }
        return match;
    }

}