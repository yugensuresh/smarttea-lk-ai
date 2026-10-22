package com.smarttea.lk.web;

import com.smarttea.lk.config.SmartteaMlProperties;
import com.smarttea.lk.service.member01.PythonMember01Client;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ml")
public class MlStatusController {

    private final SmartteaMlProperties mlProperties;
    private final PythonMember01Client mlClient;

    public MlStatusController(SmartteaMlProperties mlProperties, PythonMember01Client mlClient) {
        this.mlProperties = mlProperties;
        this.mlClient = mlClient;
    }

    @GetMapping("/status")
    public Map<String, Object> mlStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("mlEnabled", mlProperties.isEnabled());
        status.put("pythonExecutable", mlProperties.getPythonExecutable());
        status.put("inferenceScript", String.valueOf(mlProperties.getInferenceScript()));
        status.put("modelRoot", mlProperties.getModelRoot().toString());
        status.put("member01Root", mlProperties.getMember01Root().toString());
        if (!mlProperties.isEnabled()) {
            status.put("ok", false);
            status.put("detail", "ML disabled (smarttea.ml.enabled=false)");
            return status;
        }
        try {
            Map<String, Object> ping = mlClient.ping();
            status.put("ok", Boolean.TRUE.equals(ping.get("ok")));
            status.put("artifacts", artifactFlags(ping));
            status.put("diseaseModel", ping.get("diseaseModel"));
            status.put("riskModel", ping.get("riskModel"));
            status.put("modelRootResolved", ping.get("modelRoot"));
            status.put("member01RootResolved", ping.get("member01Root"));
        } catch (Exception ex) {
            status.put("ok", false);
            status.put("pythonError", ex.getMessage());
        }
        return status;
    }

    private static Map<String, Object> artifactFlags(Map<String, Object> ping) {
        Map<String, Object> flags = new LinkedHashMap<>();
        flags.put("member02Readiness", ping.get("member02Readiness"));
        flags.put("member02Yield", ping.get("member02Yield"));
        flags.put("member02Climate", ping.get("member02Climate"));
        flags.put("member03Quality", ping.get("member03Quality"));
        flags.put("member03Sustainability", ping.get("member03Sustainability"));
        return flags;
    }
}
