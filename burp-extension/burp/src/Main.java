package example.helloworld;

import burp.api.montoya.BurpExtension;
import burp.api.montoya.MontoyaApi;
import burp.api.montoya.logging.Logging;

//Burp will auto-detect and load any class that extends BurpExtension.
public class HelloWorld implements BurpExtension {
    @Override
    public void initialize(MontoyaApi api) {
        // set extension name
        api.extension().setName("Hello world extension");

        Logging logging = api.logging();

        // write a message to our output stream
        logging.logToOutput("Hello output.");

        // write a message to our error stream
        logging.logToError("Hello error.");

        // write a message to the Burp alerts tab
        logging.raiseInfoEvent("Hello info event.");
        logging.raiseDebugEvent("Hello debug event.");
        logging.raiseErrorEvent("Hello error event.");
        logging.raiseCriticalEvent("Hello critical event.");

        // throw an exception that will appear in our error stream
        throw new RuntimeException("Hello exception.");
    }
}