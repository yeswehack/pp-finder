package burp

import burp.api.montoya.logging.Logging
import java.io.BufferedWriter
import java.io.File
import java.io.FileWriter
import java.nio.file.Files

class Settings (private var logging: Logging) {
    private var userNodePath: String = "node";
    var ppFinderPath: String = "";

    fun loadPpFinder() {
        val fileName = "pp-finder";
        val classLoader = Settings::class.java.classLoader
        val resourceStream = classLoader.getResourceAsStream(fileName)
        val content = resourceStream?.bufferedReader().use { it?.readText() } ?: return

        val tempFile = Files.createTempFile(fileName, ".js") // Create a temporary file
        BufferedWriter(FileWriter(tempFile.toFile(), false)).use { writer ->
            writer.write(content) // Write content to the file
        }
        this.ppFinderPath = tempFile.toString();
    }

//    fun main() {
//        val nodeJSBinary = findNodeJSBinary()
//        if (nodeJSBinary != null) {
//            println("Node.js binary found at: $nodeJSBinary")
//        } else {
//            println("Node.js binary not found.")
//        }
//    }
}