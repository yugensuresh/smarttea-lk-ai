package com.smarttea.lk.config;

import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "smarttea.ml")
public class SmartteaMlProperties {

    /** When false, disease/risk fall back to heuristics or catalog-only responses (tests/CI). */
    private boolean enabled = true;

    private String pythonExecutable = "python";

    /** Script path relative to backend working directory. */
    private String inferenceScript = "ml/member01_inference.py";

    private Path member01Root =
            Path.of("src/main/java/com/smarttea/lk/model/Member01");

    private Path modelRoot = Path.of("src/main/java/com/smarttea/lk/model");

    private int processTimeoutSeconds = 120;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getPythonExecutable() {
        return pythonExecutable;
    }

    public void setPythonExecutable(String pythonExecutable) {
        this.pythonExecutable = pythonExecutable;
    }

    public String getInferenceScript() {
        return inferenceScript;
    }

    public void setInferenceScript(String inferenceScript) {
        this.inferenceScript = inferenceScript;
    }

    public Path getMember01Root() {
        return member01Root;
    }

    public void setMember01Root(Path member01Root) {
        this.member01Root = member01Root;
    }

    public Path getModelRoot() {
        return modelRoot;
    }

    public void setModelRoot(Path modelRoot) {
        this.modelRoot = modelRoot;
    }

    public int getProcessTimeoutSeconds() {
        return processTimeoutSeconds;
    }

    public void setProcessTimeoutSeconds(int processTimeoutSeconds) {
        this.processTimeoutSeconds = processTimeoutSeconds;
    }
}
