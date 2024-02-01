import burp.api.montoya.MontoyaApi
import burp.api.montoya.logging.Logging
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit
import java.util.concurrent.CompletableFuture



class PPCommand(
    private var api: MontoyaApi,
    private var nodePath: String,
    private var ppFinderPath: String,
    private var wrapperName: String = "__pp__",
    private var timeoutSeconds: Long = 60,
    private var chunkSize: Int = 1024
) {
    private var logging: Logging = this.api.logging();

    private fun readStream(inputStream: InputStream): String {
        val reader = BufferedReader(InputStreamReader(inputStream))
        val output = StringBuilder()
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            output.appendLine(line)
        }
        reader.close()
        return output.toString()
    }

    fun pp(source: List<Byte>, filename: String, reportUrl: String): String? {
        val cmd =
            listOf(
                nodePath,
                ppFinderPath,
                "compile",
                "--file",
                "-", // stdin
                "--name",
                wrapperName,
                "--browser",
                "--report-url",
                reportUrl
            )

        api.logging().logToOutput("Cmd: $cmd")

        val process: Process = Runtime.getRuntime().exec(cmd.toTypedArray());

        val stdoutFuture = CompletableFuture.supplyAsync {
            readStream(process.inputStream)
        }

        val stderrFuture = CompletableFuture.supplyAsync {
            readStream(process.errorStream)
        }

        for(chunk in source.chunked(chunkSize)) {
            process.outputStream.write(chunk.toByteArray());
        }

        process.outputStream.flush();
        process.outputStream.close();

        if(!process.waitFor(timeoutSeconds, TimeUnit.SECONDS)) {
            this.logging.logToError("Processing file $filename took too long (${timeoutSeconds} seconds)");
            process.destroy();
            return null;
        }

        // Retrieve and print the stdout and stderr outputs
        val stdout = stdoutFuture.get()
        val stderr = stderrFuture.get()

        if (stderr.isNotEmpty()) {
            this.logging.logToError("Received data on stderr while executing pp-finder: $stderr");
        }

        return stdout
    }

}