package burp;

import burp.api.montoya.BurpExtension
import burp.api.montoya.MontoyaApi

//Burp will auto-detect and load any class that extends BurpExtension.
@Suppress("unused")
class PPFinder : BurpExtension {
    @Override
    override fun initialize(api: MontoyaApi) {
        // set extension name
        api.extension().setName("PP-Finder Burp Extension");

        val settings = Settings(api.logging())
        settings.loadPpFinder()
        settings.loadNode()

        val fileMatcher = CompilableFileMatcher(api.logging());

        api.proxy().registerResponseHandler(JavascriptFileProxyResponseHandler(api, fileMatcher, settings))
    }
}