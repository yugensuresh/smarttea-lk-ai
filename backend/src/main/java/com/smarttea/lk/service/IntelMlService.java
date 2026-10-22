package com.smarttea.lk.service;

import com.smarttea.lk.config.SmartteaMlProperties;
import com.smarttea.lk.service.intel.IntelFeatureSets;
import com.smarttea.lk.service.intel.IntelInputValidator;
import com.smarttea.lk.service.member01.PythonMember01Client;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IntelMlService {

    private final JsonCatalogService catalog;
    private final SmartteaMlProperties mlProperties;
    private final PythonMember01Client mlClient;

    public IntelMlService(
            JsonCatalogService catalog, SmartteaMlProperties mlProperties, PythonMember01Client mlClient) {
        this.catalog = catalog;
        this.mlProperties = mlProperties;
        this.mlClient = mlClient;
    }

    public Map<String, Object> intelOverview() {
        requireMlEnabled();
        Map<String, Object> defaults = catalog.intelDefaults();
        Map<String, Object> qualityFeatures = castMap(defaults.get("teaQualityFeatures"));
        Map<String, Object> sustainFeatures = castMap(defaults.get("sustainabilityFeatures"));
        return buildOverviewResponse(predictQualityAndStii(qualityFeatures, sustainFeatures));
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> sustainabilityAssessmentPage() {
        Map<String, Object> defaults = catalog.intelDefaults();
        Map<String, Object> features = castMap(defaults.get("sustainabilityFeatures"));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sustainabilityFeatures", features);
        body.put("serviceConnected", mlProperties.isEnabled());

        if (!mlProperties.isEnabled()) {
            body.put("ok", false);
            body.put("error", mlDisabledMessage());
            body.put("performanceScore", unavailablePerformanceScore());
            body.put("prediction", unavailablePrediction("Model 02 sustainability"));
            body.put("inferenceEngine", "unavailable");
            body.put("meta", Map.of("updated", java.time.Instant.now().toString(), "inferenceEngine", "unavailable"));
            return body;
        }

        Map<String, Object> prediction;
        try {
            prediction = predictSustainability(features);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            body.put("ok", false);
            body.put("error", ex.getMessage());
            body.put("performanceScore", unavailablePerformanceScore());
            body.put("prediction", unavailablePrediction("Model 02 sustainability"));
            body.put("inferenceEngine", "error");
            body.put(
                    "meta",
                    Map.of("updated", java.time.Instant.now().toString(), "inferenceEngine", "error"));
            return body;
        }

        double score = toDouble(prediction.get("sustainabilityScore"));
        String label = String.valueOf(prediction.get("performanceLabel"));
        body.put("ok", true);
        body.put(
                "performanceScore",
                Map.of(
                        "value",
                        (int) Math.round(score),
                        "max",
                        100,
                        "label",
                        label,
                        "sub",
                        "Model 02 Sustainability (RandomForest regressor)"));
        body.put("prediction", prediction);
        body.put("inferenceEngine", prediction.get("inferenceEngine"));
        body.put(
                "meta",
                Map.of(
                        "updated",
                        java.time.Instant.now().toString(),
                        "inferenceEngine",
                        prediction.get("inferenceEngine")));
        return body;
    }

    public Map<String, Object> predictTeaQuality(Map<String, Object> features) {
        IntelInputValidator.requireFeatures(features, IntelFeatureSets.TEA_QUALITY, "Model 01 tea quality");
        return invokeTeaQuality(features);
    }

    public Map<String, Object> predictSustainability(Map<String, Object> features) {
        IntelInputValidator.requireFeatures(features, IntelFeatureSets.SUSTAINABILITY, "Model 02 sustainability");
        return invokeSustainability(features);
    }

    public Map<String, Object> predictStii(String teaGrade, double sustainabilityScore) {
        if (teaGrade == null || teaGrade.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "STII: teaGrade is required");
        }
        if (!Double.isFinite(sustainabilityScore)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "STII: sustainabilityScore must be finite");
        }
        requireMlEnabled();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("teaGrade", teaGrade);
        body.put("sustainabilityScore", sustainabilityScore);
        return invokeStii(body);
    }

    public Map<String, Object> predictQualityAndStii(
            Map<String, Object> qualityFeatures, Map<String, Object> sustainabilityFeatures) {
        IntelInputValidator.requireFeatures(qualityFeatures, IntelFeatureSets.TEA_QUALITY, "Model 01 tea quality");
        IntelInputValidator.requireFeatures(
                sustainabilityFeatures, IntelFeatureSets.SUSTAINABILITY, "Model 02 sustainability");

        Map<String, Object> quality = invokeTeaQuality(qualityFeatures);
        Map<String, Object> sustain = invokeSustainability(sustainabilityFeatures);
        String grade = String.valueOf(quality.get("teaGrade"));
        double sustainScore = toDouble(sustain.get("sustainabilityScore"));
        Map<String, Object> stii = predictStii(grade, sustainScore);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("ok", true);
        out.put("teaQuality", quality);
        out.put("sustainability", sustain);
        out.put("stii", stii);
        out.put("qualityScoreEquivalent", stii.get("quality_score_equiv"));
        out.put("stiiScore", stii.get("stii_score"));
        out.put("performanceTier", stii.get("performance_tier"));
        out.put("serviceConnected", true);
        out.put("inferenceEngine", quality.get("inferenceEngine"));
        return out;
    }

    private Map<String, Object> buildOverviewResponse(Map<String, Object> bundle) {
        Map<String, Object> teaQuality = castMap(bundle.get("teaQuality"));
        Map<String, Object> sustainability = castMap(bundle.get("sustainability"));
        Map<String, Object> stii = castMap(bundle.get("stii"));

        String grade = String.valueOf(teaQuality.get("teaGrade"));
        double qualityNumeric = toDouble(stii.get("quality_score_equiv"));
        double sustainScore = toDouble(sustainability.get("sustainabilityScore"));
        double stiiScore = toDouble(stii.get("stii_score"));
        double topProb = topClassProbability(teaQuality.get("probabilities"));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put(
                "kpis",
                Map.of(
                        "teaGrade",
                        grade,
                        "qualityScoreEquivalent",
                        qualityNumeric,
                        "teaQualityConfidence",
                        Math.round(topProb * 100),
                        "sustainabilityScore",
                        Math.round(sustainScore),
                        "sustainabilityLabel",
                        sustainability.get("performanceLabel"),
                        "stiiScore",
                        stiiScore,
                        "stiiTier",
                        stii.get("performance_tier")));
        body.put("teaQuality", teaQuality);
        body.put("sustainability", sustainability);
        body.put("stii", stii);
        body.put("serviceConnected", true);
        body.put("inferenceEngine", teaQuality.get("inferenceEngine"));
        return body;
    }

    private Map<String, Object> invokeTeaQuality(Map<String, Object> features) {
        requireMlEnabled();
        Map<String, Object> result = invokeMlTask("tea-quality", Map.of("features", features));
        assertInferenceEngine(result, "sklearn-gbc-tea-quality-v1", "Model 01 tea quality");
        return result;
    }

    private Map<String, Object> invokeSustainability(Map<String, Object> features) {
        requireMlEnabled();
        Map<String, Object> result = invokeMlTask("sustainability", Map.of("features", features));
        assertInferenceEngine(result, "sklearn-rf-sustainability-v1", "Model 02 sustainability");
        return result;
    }

    private Map<String, Object> invokeStii(Map<String, Object> body) {
        Map<String, Object> result = invokeMlTask("stii", body);
        assertInferenceEngine(result, "stii-formula-v1", "STII");
        return result;
    }

    private Map<String, Object> invokeMlTask(String task, Map<String, Object> body) {
        try {
            return mlClient.invokeTask(task, body);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        }
    }

    private void requireMlEnabled() {
        if (!mlProperties.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, mlDisabledMessage());
        }
    }

    private static String mlDisabledMessage() {
        return "Member 03 ML inference is disabled (smarttea.ml.enabled=false).";
    }

    private static void assertInferenceEngine(Map<String, Object> result, String expected, String label) {
        String engine = String.valueOf(result.get("inferenceEngine"));
        if (!expected.equals(engine)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, label + " returned unexpected inference engine: " + engine);
        }
    }

    private static Map<String, Object> unavailablePerformanceScore() {
        Map<String, Object> score = new LinkedHashMap<>();
        score.put("value", null);
        score.put("max", 100);
        score.put("label", "Unavailable");
        score.put("sub", "Model inference not available");
        return score;
    }

    private static Map<String, Object> unavailablePrediction(String context) {
        Map<String, Object> prediction = new LinkedHashMap<>();
        prediction.put("ok", false);
        prediction.put("error", context + " unavailable");
        prediction.put("inferenceEngine", "unavailable");
        return prediction;
    }

    private static double topClassProbability(Object probs) {
        if (probs instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> first) {
            return toDouble(first.get("probability"));
        }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private static double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0;
    }
}
