package com.smarttea.lk.service.member01;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttea.lk.config.SmartteaMlProperties;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class PythonMember01Client {

    private static final Logger log = LoggerFactory.getLogger(PythonMember01Client.class);

    private final SmartteaMlProperties properties;
    private final ObjectMapper objectMapper;

    public PythonMember01Client(SmartteaMlProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> invoke(Map<String, Object> request) {
        Path script = Path.of(properties.getInferenceScript()).toAbsolutePath().normalize();
        if (!Files.isRegularFile(script)) {
            throw new IllegalStateException("ML script not found: " + script);
        }
        try {
            ProcessBuilder builder =
                    new ProcessBuilder(properties.getPythonExecutable(), script.toString());
            builder.directory(script.getParent().getParent().toFile());
            builder.environment().put("SMARTTEA_MEMBER01_ROOT", properties.getMember01Root().toAbsolutePath().toString());
            builder.environment().put("SMARTTEA_MODEL_ROOT", properties.getModelRoot().toAbsolutePath().toString());
            builder.environment().put("XGBOOST_VERBOSITY", "0");
            builder.redirectErrorStream(false);
            Process process = builder.start();
            byte[] json = objectMapper.writeValueAsBytes(request);
            process.getOutputStream().write(json);
            process.getOutputStream().close();

            boolean finished =
                    process.waitFor(properties.getProcessTimeoutSeconds(), TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IllegalStateException("ML process timed out");
            }

            String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8).trim();

            if (!stderr.isEmpty()) {
                log.warn("ML subprocess stderr (diagnostic): {}", truncateForLog(stderr, 4000));
            }

            if (process.exitValue() != 0) {
                throw new IllegalStateException(
                        "ML process failed (exit "
                                + process.exitValue()
                                + "): "
                                + firstLine(stderr.isEmpty() ? stdout : stderr));
            }

            if (stdout.isEmpty()) {
                throw new IllegalStateException(
                        "ML process produced empty stdout"
                                + (stderr.isEmpty() ? "" : "; see stderr in server log"));
            }

            String jsonPayload = extractJsonPayload(stdout);
            Map<String, Object> parsed;
            try {
                parsed = objectMapper.readValue(jsonPayload, new TypeReference<>() {});
            } catch (IOException parseEx) {
                throw new IllegalStateException(
                        "ML stdout is not valid JSON: "
                                + parseEx.getMessage()
                                + "; stdout prefix: "
                                + truncateForLog(stdout, 200),
                        parseEx);
            }

            if (Boolean.FALSE.equals(parsed.get("ok"))) {
                Object err = parsed.get("error");
                throw new IllegalStateException(err != null ? String.valueOf(err) : "ML inference failed");
            }
            return parsed;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("ML inference interrupted", ex);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not run ML inference: " + ex.getMessage(), ex);
        }
    }

    /**
     * Native libs (e.g. XGBoost on Windows) sometimes print log lines to stdout before the JSON payload.
     */
    static String extractJsonPayload(String stdout) {
        if (stdout == null || stdout.isEmpty()) {
            return stdout;
        }
        String trimmed = stdout.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return trimmed;
        }
        String[] lines = trimmed.split("\\R");
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (line.startsWith("{") && line.endsWith("}")) {
                return line;
            }
        }
        int start = trimmed.lastIndexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }

    private static String truncateForLog(String text, int maxLen) {
        if (text == null || text.length() <= maxLen) {
            return text;
        }
        return text.substring(0, maxLen) + "…";
    }

    private static String firstLine(String text) {
        if (text == null || text.isEmpty()) {
            return "(no output)";
        }
        int nl = text.indexOf('\n');
        return nl >= 0 ? text.substring(0, nl) : text;
    }

    public Map<String, Object> invokeTask(String task, Map<String, Object> body) {
        Map<String, Object> req = new LinkedHashMap<>(body != null ? body : Map.of());
        req.put("task", task);
        return invoke(req);
    }

    public Map<String, Object> ping() {
        Map<String, Object> req = new LinkedHashMap<>();
        req.put("task", "ping");
        return invoke(req);
    }

    public Map<String, Object> predictDisease(Path imageFile) {
        Map<String, Object> req = new LinkedHashMap<>();
        req.put("task", "disease");
        req.put("imagePath", imageFile.toAbsolutePath().toString());
        return invoke(req);
    }

    public Map<String, Object> predictRisk(Map<String, Object> features) {
        Map<String, Object> req = new LinkedHashMap<>();
        req.put("task", "risk");
        req.put("features", features);
        return invoke(req);
    }
}
