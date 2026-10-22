package com.smarttea.lk.service;

import com.smarttea.lk.config.SmartteaMlProperties;
import com.smarttea.lk.service.member01.PythonMember01Client;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EnvironmentalRiskPredictionService {

    private final JsonCatalogService catalog;
    private final SmartteaMlProperties mlProperties;
    private final PythonMember01Client mlClient;

    public EnvironmentalRiskPredictionService(
            JsonCatalogService catalog, SmartteaMlProperties mlProperties, PythonMember01Client mlClient) {
        this.catalog = catalog;
        this.mlProperties = mlProperties;
        this.mlClient = mlClient;
    }

    public Map<String, Object> getSnapshot() {
        Map<String, Object> seed = catalog.environmentalRisk();
        Map<String, Object> meta = castMap(seed.get("meta"));
        meta.put("serviceConnected", mlProperties.isEnabled());
        meta.put("inferenceEngine", "catalog-seed");
        meta.put("inferenceRan", false);
        meta.put("modelStatus", "Illustrative catalog snapshot (no Model 02 inference run)");
        meta.put("contentSource", "catalog");
        seed.put("meta", meta);
        seed.put("catalogIllustrative", illustrativeSectionFlags());
        return seed;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> predict(Map<String, Object> payload) {
        if (!mlProperties.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Model 02 ML inference is disabled (smarttea.ml.enabled=false).");
        }

        Map<String, Object> features = extractFeatures(payload);
        Map<String, Object> ml;
        try {
            ml = mlClient.predictRisk(features);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Model 02 inference failed: " + ex.getMessage(), ex);
        }

        if (!"sklearn-hgb-v1".equals(String.valueOf(ml.get("inferenceEngine")))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Model 02 returned unexpected inference engine: " + ml.get("inferenceEngine"));
        }

        String category = String.valueOf(ml.get("riskCategory"));
        int riskScore = ((Number) ml.get("riskScore")).intValue();

        Map<String, Object> response = new LinkedHashMap<>();
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("model", "Model 02");
        meta.put("engine", "HistGradientBoostingClassifier v1.2");
        meta.put("endpoint", "/api/v1/predict/environmental-risk");
        meta.put("serviceConnected", true);
        meta.put("inferenceEngine", ml.get("inferenceEngine"));
        meta.put("inferenceRan", true);
        meta.put("modelStatus", "HistGradientBoosting inference complete");
        meta.put("contentSource", "prediction");
        meta.put("refreshedAt", java.time.Instant.now().toString());
        meta.put(
                "riskScoreNote",
                "riskScore is a model-derived index from class probability, not a validated field measurement.");
        response.put("meta", meta);

        if (payload != null && !payload.isEmpty()) {
            response.put("request", payload);
        }

        Map<String, Object> alert = new LinkedHashMap<>();
        alert.put("category", category);
        alert.put("diseaseFocus", "Model 02 environmental pressure — " + category.toLowerCase() + " band");
        alert.put(
                "explanation",
                "HistGradientBoostingClassifier scored submitted estate features. Risk index "
                        + riskScore
                        + "/100 (model-derived index).");
        alert.put("contributors", buildContributors(features));
        response.put("alert", alert);

        response.put("prediction", ml);
        Object pdviProbs = ml.get("severityProbabilitiesForPdvi");
        if (pdviProbs != null) {
            response.put("severityProbabilitiesForPdvi", pdviProbs);
        }
        response.put("modelInputs", buildModelInputs(features));
        response.put("telemetry", buildTelemetry(features));
        response.put("catalogIllustrative", illustrativeSectionFlags());
        return response;
    }

    private static Map<String, Boolean> illustrativeSectionFlags() {
        Map<String, Boolean> flags = new LinkedHashMap<>();
        flags.put("metrics", true);
        flags.put("hourlyTrend", true);
        flags.put("actionPlan", true);
        return flags;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> extractFeatures(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Model 02 requires a JSON body with a features object.");
        }
        Object nested = payload.get("features");
        if (nested instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return payload;
    }

    private static List<String> buildContributors(Map<String, Object> features) {
        List<String> lines = new ArrayList<>();
        addContributor(lines, "Temperature", features.get("temperature_c"), "°C");
        addContributor(lines, "Relative humidity", features.get("relative_humidity_pct"), "%");
        addContributor(lines, "Leaf wetness", features.get("leaf_wetness"), "h");
        addContributor(lines, "Rainfall (24h)", features.get("rainfall_mm"), "mm");
        return lines;
    }

    private static void addContributor(List<String> lines, String label, Object value, String unit) {
        if (value != null) {
            lines.add(label + ": " + value + " " + unit);
        }
    }

    private static List<Map<String, String>> buildModelInputs(Map<String, Object> features) {
        List<Map<String, String>> rows = new ArrayList<>();
        for (Map.Entry<String, Object> entry : features.entrySet()) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("feature", entry.getKey());
            row.put("value", String.valueOf(entry.getValue()));
            rows.add(row);
        }
        return rows;
    }

    private static List<Map<String, String>> buildTelemetry(Map<String, Object> features) {
        List<Map<String, String>> rows = new ArrayList<>();
        putTelemetry(rows, "Canopy humidity", features.get("relative_humidity_pct"), "%");
        putTelemetry(rows, "Air temperature", features.get("temperature_c"), "°C");
        putTelemetry(rows, "Soil moisture", features.get("soil_moisture_pct"), "%");
        putTelemetry(rows, "Wind speed", features.get("wind_speed"), "m/s");
        return rows;
    }

    private static void putTelemetry(
            List<Map<String, String>> rows, String sensor, Object value, String unit) {
        if (value == null) {
            return;
        }
        Map<String, String> row = new LinkedHashMap<>();
        row.put("sensor", sensor);
        row.put("value", value + " " + unit);
        row.put("status", "Manual / prediction input");
        rows.add(row);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return new LinkedHashMap<>();
    }

    private static double toNumber(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return Double.parseDouble(String.valueOf(value));
    }
}
