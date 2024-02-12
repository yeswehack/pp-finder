package burp

import burp.api.montoya.logging.Logging
import java.io.BufferedWriter
import java.io.File
import java.io.FileWriter
import java.nio.file.Files

class Settings (private var logging: Logging) {
    var nodePath: String = "node";
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

    fun loadNode() {
        val nodeJsBinary = findNodeJsBinary()

        if (nodeJsBinary != null) {
            nodePath = nodeJsBinary
        } else {
            nodePath = "node"
            if (getOsName() == "win") nodePath += ".exe";
        }
    }

    private fun getOsName(): String {
       return System.getProperty("os.name").lowercase()
    }

    private fun findNodeJsBinary(): String? {
        val osName = getOsName()

        return when {
            osName.contains("nix") || osName.contains("nux") || osName.contains("mac") -> {
                findNodeJsBinaryUnix()
            }
            osName.contains("win") -> {
                findNodeJsBinaryWindows()
            }
            else -> {
                null // Unsupported operating system
            }
        }
    }

    private fun findNodeJsBinaryUnix(): String? {
        val possiblePaths = listOf("/usr/bin/node", "/usr/local/bin/node", "/opt/nodejs/bin/node")

        return possiblePaths.firstOrNull { File(it).exists() }
    }

    private fun findNodeJsBinaryWindows(): String? {
        val systemRoot = System.getenv("SystemRoot") ?: "C:\\Windows"
        val possiblePaths = listOf(
            File("${systemRoot}\\System32\\node.exe"),
            File("${systemRoot}\\SysWow64\\node.exe")
        )

        return possiblePaths.firstOrNull { it.exists() }?.absolutePath
    }
}