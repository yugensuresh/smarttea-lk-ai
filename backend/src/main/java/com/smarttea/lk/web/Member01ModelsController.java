package com.smarttea.lk.web;

import com.smarttea.lk.config.SmartteaMlProperties;
import com.smarttea.lk.service.JsonCatalogService;
import com.smarttea.lk.service.member01.PythonMember01Client;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/models")
public class Member01ModelsController {

    private final JsonCatalogService catalog;
    private final SmartteaMlProperties mlProperties;
    private final PythonMember01Client mlClient;

    public Member01ModelsController(
            JsonCatalogService catalog, SmartteaMlProperties mlProperties, PythonMember01Client mlClient) {
        this.catalog = catalog;
        this.mlProperties = mlProperties;
        this.mlClient = mlClient;
    }

    @GetMapping("/risk")
    public Map<String, Object> riskModelMeta() {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("id", "02");
        meta.put("name", "HistGradientBoostingClassifier");
        meta.put("version", "v1.2");
        meta.put("endpointPredict", "/api/v1/predict/environmental-risk");
        meta.put("mlEnabled", mlProperties.isEnabled());
        meta.put("artifact", "Member01/Riskprediction/Model02_Final_Model.joblib");
        if (mlProperties.isEnabled()) {
            try {
                Map<String, Object> ping = mlClient.ping();
                meta.put("serviceConnected", Boolean.TRUE.equals(ping.get("riskModel")));
            } catch (Exception ex) {
                meta.put("serviceConnected", false);
                meta.put("connectionNote", ex.getMessage());
            }
        }
        return meta;
    }

    @GetMapping("/pdvi")
    public Map<String, Object> pdviModelMeta() {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("id", "03");
        meta.put("name", "PDVI fusion formula");
        meta.put("endpointPredict", "/api/v1/predict/pdvi");
        meta.put("notebook", "Member01/PDVI/Model03_PDVI_Final.ipynb");
        meta.put("inferenceEngine", "pdvi-formula-v1");
        meta.put("serviceConnected", true);
        return meta;
    }

    @GetMapping("/member01/status")
    public Map<String, Object> member01Status() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("mlEnabled", mlProperties.isEnabled());
        status.put("diseaseMeta", catalog.diseaseModelMeta());
        status.put("riskMeta", riskModelMeta());
        status.put("pdviMeta", pdviModelMeta());
        status.put(
                "inferenceNote",
                "Artifact/ping status does not prove POST inference succeeded; check inferenceEngine on predict responses.");
        if (mlProperties.isEnabled()) {
            try {
                Map<String, Object> ping = mlClient.ping();
                status.put("python", ping);
                status.put("artifactsPresent", Map.of(
                        "diseaseModel", Boolean.TRUE.equals(ping.get("diseaseModel")),
                        "riskModel", Boolean.TRUE.equals(ping.get("riskModel"))));
            } catch (Exception ex) {
                status.put("pythonError", ex.getMessage());
            }
        }
        return status;
    }
}
