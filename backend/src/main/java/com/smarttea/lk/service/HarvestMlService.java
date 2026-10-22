package com.smarttea.lk.service;

import com.smarttea.lk.config.SmartteaMlProperties;
import com.smarttea.lk.service.member01.PythonMember01Client;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class HarvestMlService {

    private final JsonCatalogService catalog;
    private final SmartteaMlProperties mlProperties;
    private final PythonMember01Client mlClient;

    public HarvestMlService(
            JsonCatalogService catalog, SmartteaMlProperties mlProperties, PythonMember01Client mlClient) {
        this.catalog = catalog;
        this.mlProperties = mlProperties;
        this.mlClient = mlClient;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> readinessPage() {
        Map<String, Object> defaults = catalog.harvestDefaults();
        List<Map<String, Object>> templates = castList(defaults.get("readinessFields"));
        List<Map<String, Object>> fields = new ArrayList<>();
        int ready = 0;
        int near = 0;
        int not = 0;

        for (Map<String, Object> template : templates) {
            Map<String, Object> field = catalog.copyMap(template);
            Map<String, Object> features = castMap(template.get("mlFeatures"));
            Map<String, Object> prediction;
            try {
                prediction = predictReadiness(features);
            } catch (Exception ex) {
                prediction = readinessPredictionError(ex.getMessage());
            }
            double maturity = toDouble(prediction.get("maturityIndex"));
            boolean isReady = Boolean.TRUE.equals(prediction.get("ready"));
            String tone;
            String status;
            String description;
            if (prediction.get("error") != null) {
                tone = "not";
                status = "INFERENCE FAILED";
                description = "Model 1 readiness inference failed: " + prediction.get("error");
            } else if (maturity >= 25 || isReady) {
                tone = "ready";
                status = "READY NOW";
                description = readinessDescription(maturity, isReady);
                ready++;
            } else if (maturity >= 12) {
                tone = "near";
                status = "NEARLY READY";
                description = readinessDescription(maturity, isReady);
                near++;
            } else {
                tone = "not";
                status = "NOT READY";
                description = readinessDescription(maturity, isReady);
                not++;
            }
            field.put("status", status);
            field.put("statusTone", tone);
            field.put("maturity", (int) Math.round(maturity));
            field.put("description", description);
            field.put("action", tone.equals("ready") ? "Assign Team" : tone.equals("near") ? "Monitor" : "Details");
            field.put(
                    "actionTone",
                    tone.equals("ready") ? "primary" : tone.equals("near") ? "outline" : "ghost");
            field.put("mlFeatures", features);
            field.put("prediction", prediction);
            field.put(
                    "stats",
                    Map.of(
                            "lastPlucked",
                            "—",
                            "secondary",
                            Map.of("label", "Model readiness", "value", prediction.get("readinessLabel")),
                            "yield",
                            "—",
                            "spark",
                            List.of(8, 9, 10, 11, 12, 13, (int) Math.round(maturity / 5))));
            fields.add(field);
        }

        int total = Math.max(1, ready + near + not);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fields", fields);
        body.put(
                "estateOverview",
                Map.of(
                        "readyPercent",
                        (int) Math.round((ready * 100.0) / total),
                        "legend",
                        List.of(
                                Map.of("label", "Ready Now", "count", ready, "tone", "ready"),
                                Map.of("label", "Nearly Ready", "count", near, "tone", "near"),
                                Map.of("label", "Not Ready", "count", not, "tone", "not"))));
        body.put("envContext", envContextFromFields(fields));
        body.put("serviceConnected", mlProperties.isEnabled());
        body.put("inferenceEngine", predictionEngineFromFields(fields));
        body.put("inferenceSummary", readinessInferenceSummary(fields));
        return body;
    }

    /** Mean of catalog {@code mlFeatures} on each field — not live estate telemetry. */
    static Map<String, Object> envContextFromFields(List<Map<String, Object>> fields) {
        double tempSum = 0;
        double humSum = 0;
        int n = 0;
        for (Map<String, Object> field : fields) {
            Map<String, Object> feat = castMap(field.get("mlFeatures"));
            if (feat.isEmpty()) {
                continue;
            }
            tempSum += toDouble(feat.get("temperature_c"));
            humSum += toDouble(feat.get("humidity_percent"));
            n++;
        }
        String avgTemp = n > 0 ? String.format("%.1f°C", tempSum / n) : "—";
        String humidity = n > 0 ? String.format("%.0f%%", humSum / n) : "—";
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put(
                "body",
                "Harvest readiness (XGBoost) — maturity index is readiness probability × 100 (typical range 0–30%).");
        ctx.put("avgTemp", avgTemp);
        ctx.put("humidity", humidity);
        ctx.put(
                "telemetryNote",
                n > 0
                        ? "Avg temp and humidity are the mean of each field's catalog mlFeatures — not live sensors."
                        : "No mlFeatures available for environmental summary.");
        ctx.put("alert", "Ready ≥25%, nearly ready ≥12% on the maturity index.");
        ctx.put("illustrativeTelemetry", true);
        return ctx;
    }

    static Map<String, Object> readinessInferenceSummary(List<Map<String, Object>> fields) {
        int live = 0;
        int failed = 0;
        int fallback = 0;
        for (Map<String, Object> field : fields) {
            Object predObj = field.get("prediction");
            if (!(predObj instanceof Map<?, ?> pred)) {
                failed++;
                continue;
            }
            String engine = String.valueOf(pred.get("inferenceEngine"));
            if ("error".equals(engine) || pred.get("error") != null) {
                failed++;
            } else if ("xgb-harvest-readiness-v1".equals(engine)) {
                live++;
            } else if ("catalog-fallback".equals(engine)) {
                fallback++;
            }
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("liveFieldPredictions", live);
        summary.put("failedFieldPredictions", failed);
        summary.put("fallbackFieldPredictions", fallback);
        summary.put("fieldCount", fields.size());
        return summary;
    }

    private static String predictionEngineFromFields(List<Map<String, Object>> fields) {
        if (fields.isEmpty()) {
            return "catalog-fallback";
        }
        boolean anyLive = false;
        boolean anyError = false;
        for (Map<String, Object> field : fields) {
            Object predObj = field.get("prediction");
            if (!(predObj instanceof Map<?, ?> pred)) {
                anyError = true;
                continue;
            }
            String engine = String.valueOf(pred.get("inferenceEngine"));
            if ("xgb-harvest-readiness-v1".equals(engine) && pred.get("error") == null) {
                anyLive = true;
            } else if ("error".equals(engine) || pred.get("error") != null) {
                anyError = true;
            }
        }
        if (anyError && !anyLive) {
            return "error";
        }
        if (anyLive) {
            return "xgb-harvest-readiness-v1";
        }
        return "catalog-fallback";
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> forecastingPage() {
        Map<String, Object> defaults = catalog.harvestDefaults();
        Map<String, Object> features = castMap(defaults.get("yieldFeatures"));
        Map<String, Object> prediction;
        try {
            prediction = predictYield(features);
        } catch (Exception ex) {
            prediction = new LinkedHashMap<>();
            prediction.put("ok", false);
            prediction.put("error", ex.getMessage());
            prediction.put("inferenceEngine", "error");
            features = castMap(defaults.get("yieldFeatures"));
        }
        double kg = toDouble(prediction.get("predictedYieldKg"));
        boolean yieldLive = "xgb-yield-v1".equals(String.valueOf(prediction.get("inferenceEngine")))
                && prediction.get("error") == null
                && kg > 0;

        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> predictedYieldKpi = new LinkedHashMap<>();
        if (yieldLive) {
            predictedYieldKpi.put("value", String.format("%,.0f", kg));
            predictedYieldKpi.put("unit", "kg");
            predictedYieldKpi.put("delta", "Model 2 · xgb-yield-v1");
            predictedYieldKpi.put("live", true);
        } else {
            predictedYieldKpi.put("value", "—");
            predictedYieldKpi.put("unit", "kg");
            predictedYieldKpi.put(
                    "delta",
                    prediction.get("error") != null
                            ? "Yield inference failed — see prediction.error"
                            : "No live yield prediction");
            predictedYieldKpi.put("live", false);
        }
        body.put(
                "kpis",
                Map.of(
                        "predictedYield",
                        predictedYieldKpi,
                        "modelConfidence",
                        yieldLive ? 92 : 0,
                        "peakDate",
                        Map.of(
                                "value",
                                yieldLive ? "Next cycle" : "—",
                                "note",
                                yieldLive ? "From yield model" : "Unavailable until inference succeeds",
                                "badge",
                                yieldLive ? "LIVE" : "N/A")));
        body.put("prediction", prediction);
        body.put("yieldFeatures", features);
        body.put("environmentalDrivers", environmentalDriversFromYieldFeatures(features));
        Map<String, Object> variance = new LinkedHashMap<>();
        variance.put("demoData", true);
        variance.put(
                "note",
                yieldLive
                        ? "Historical cycles below are catalog demo; top KPI is live from Model 2 (xgb-yield-v1)."
                        : "Historical cycles below are catalog demo; yield KPI is not live until inference succeeds.");
        if (yieldLive) {
            variance.put("livePredictedKg", kg);
        }
        body.put("varianceAnalysis", variance);
        body.put("serviceConnected", mlProperties.isEnabled());
        body.put("inferenceEngine", prediction.get("inferenceEngine"));
        return body;
    }

    private static List<Map<String, Object>> environmentalDriversFromYieldFeatures(Map<String, Object> features) {
        List<Map<String, Object>> drivers = new ArrayList<>();
        drivers.add(
                driver(
                        "moisture",
                        "Soil Moisture",
                        features.get("soil_moisture_pct") + "%",
                        "From yield model inputs",
                        "droplet"));
        drivers.add(
                driver(
                        "temp",
                        "Avg Temperature",
                        features.get("temperature_avg_c") + "°C",
                        "Max " + features.get("temperature_max_c") + "°C / min " + features.get("temperature_min_c") + "°C",
                        "thermometer"));
        drivers.add(
                driver(
                        "rain",
                        "Rainfall",
                        features.get("rainfall_mm") + " mm",
                        "Humidity " + features.get("humidity_pct") + "%",
                        "droplet"));
        return drivers;
    }

    private static Map<String, Object> driver(String id, String label, String value, String sub, String icon) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id);
        row.put("label", label);
        row.put("value", value);
        row.put("sub", sub);
        row.put("icon", icon);
        row.put("impact", "Model input");
        row.put("impactTone", "positive");
        return row;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> climateRiskPage() {
        Map<String, Object> defaults = catalog.harvestDefaults();
        Map<String, Object> features = castMap(defaults.get("climateFeatures"));
        Map<String, Object> climate;
        try {
            climate = predictClimate(features);
        } catch (Exception ex) {
            climate = new LinkedHashMap<>();
            climate.put("ok", false);
            climate.put("riskLevel", "UNKNOWN");
            climate.put("confidence", 0);
            climate.put("error", ex.getMessage());
            climate.put("inferenceEngine", "error");
        }

        String level = String.valueOf(climate.get("riskLevel"));
        double confidence = toDouble(climate.get("confidence"));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put(
                "riskAlert",
                Map.of(
                        "level",
                        level,
                        "confidence",
                        (int) Math.round(confidence),
                        "body",
                        "Model 03 climate risk (XGBoost) for rainfall "
                                + features.get("rainfall_mm")
                                + " mm and avg temp "
                                + features.get("temperature_avg_c")
                                + "°C."));
        body.put(
                "optimalWindow",
                Map.of(
                        "range",
                        "See 5-day forecast",
                        "body",
                        "Use lower-risk days in the micro-climate strip for scheduling."));
        body.put("prediction", climate);
        body.put("climateFeatures", features);
        body.put("microClimateForecast", catalog.microClimateForecastDemo());
        body.put("microClimateForecastDemo", true);
        body.put("serviceConnected", mlProperties.isEnabled());
        body.put("inferenceEngine", climate.get("inferenceEngine"));
        return body;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> thrriPage() {
        Map<String, Object> defaults = catalog.harvestDefaults();
        Map<String, Object> climateFeatures = castMap(defaults.get("climateFeatures"));
        Map<String, Object> readinessFeatures =
                castMap(((List<Map<String, Object>>) defaults.get("readinessFields")).get(0).get("mlFeatures"));

        Map<String, Object> readiness;
        try {
            readiness = predictReadiness(readinessFeatures);
        } catch (Exception ex) {
            readiness = readinessPredictionError(ex.getMessage());
        }

        Map<String, Object> risk;
        try {
            risk = predictClimate(climateFeatures);
        } catch (Exception ex) {
            risk =
                    Map.of(
                            "ok",
                            false,
                            "riskLevel",
                            "UNKNOWN",
                            "highRiskProbability",
                            0.3,
                            "error",
                            ex.getMessage(),
                            "inferenceEngine",
                            "error");
        }

        Map<String, Object> thrri;
        try {
            Map<String, Object> thrriInput = new LinkedHashMap<>();
            thrriInput.put("readinessProbability", readiness.get("readinessProbability"));
            thrriInput.put("highRiskProbability", risk.get("highRiskProbability"));
            thrri = predictThrri(thrriInput);
        } catch (Exception ex) {
            thrri = new LinkedHashMap<>();
            thrri.put("ok", false);
            thrri.put("error", ex.getMessage());
            thrri.put("thrriScore", 0);
            thrri.put("recommendation", "Unavailable");
            thrri.put("inferenceEngine", "error");
        }

        normalizeThrriKeys(thrri);
        Map<String, Object> body = new LinkedHashMap<>(thrri);
        body.put("readiness", readiness);
        body.put("climate", risk);
        body.put("serviceConnected", mlProperties.isEnabled());
        body.put(
                "inferenceEngine",
                thrri.get("inferenceEngine") != null
                        ? thrri.get("inferenceEngine")
                        : readiness.get("inferenceEngine"));
        return body;
    }

    private static void normalizeThrriKeys(Map<String, Object> thrri) {
        copySnakeToCamel(thrri, "thrriScore", "thrri_score");
        copySnakeToCamel(thrri, "readinessScore", "readiness_score");
        copySnakeToCamel(thrri, "highRiskScore", "high_risk_score");
    }

    private static void copySnakeToCamel(Map<String, Object> map, String camel, String snake) {
        if (!map.containsKey(camel) && map.get(snake) != null) {
            map.put(camel, map.get(snake));
        }
    }

    public Map<String, Object> predictReadiness(Map<String, Object> features) {
        if (!mlProperties.isEnabled()) {
            return fallbackReadiness();
        }
        Map<String, Object> req = new LinkedHashMap<>();
        req.put("features", features);
        return mlClient.invokeTask("harvest-readiness", req);
    }

    public Map<String, Object> predictYield(Map<String, Object> features) {
        if (!mlProperties.isEnabled()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("ok", false);
            map.put("error", "ML inference is disabled (smarttea.ml.enabled=false)");
            map.put("inferenceEngine", "catalog-fallback");
            return map;
        }
        return mlClient.invokeTask("harvest-yield", Map.of("features", features));
    }

    public Map<String, Object> predictClimate(Map<String, Object> features) {
        if (!mlProperties.isEnabled()) {
            return Map.of(
                    "ok",
                    true,
                    "riskLevel",
                    "MODERATE",
                    "confidence",
                    70,
                    "highRiskProbability",
                    0.3,
                    "inferenceEngine",
                    "catalog-fallback");
        }
        return mlClient.invokeTask("harvest-climate", Map.of("features", features));
    }

    public Map<String, Object> predictThrri(Map<String, Object> body) {
        if (!mlProperties.isEnabled()) {
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("ok", true);
            fallback.put("thrriScore", 65.0);
            fallback.put("thrri_score", 65.0);
            fallback.put("recommendation", "Monitor Conditions");
            fallback.put("inferenceEngine", "catalog-fallback");
            return fallback;
        }
        Map<String, Object> result = mlClient.invokeTask("harvest-thrri", body);
        normalizeThrriKeys(result);
        return result;
    }

    private static Map<String, Object> fallbackReadiness() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("ok", true);
        map.put("maturityIndex", 65);
        map.put("ready", false);
        map.put("readinessLabel", "Not Ready");
        map.put("readinessProbability", 0.65);
        map.put("inferenceEngine", "catalog-fallback");
        return map;
    }

    private static Map<String, Object> readinessPredictionError(String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("ok", false);
        map.put("error", message);
        map.put("inferenceEngine", "error");
        map.put("maturityIndex", 0);
        map.put("ready", false);
        map.put("readinessLabel", "Unavailable");
        map.put("readinessProbability", 0);
        return map;
    }

    private static String readinessDescription(double maturity, boolean ready) {
        if (ready || maturity >= 25) {
            return "Model 1: readiness probability meets the plucking threshold (≥25% index) for current microclimate.";
        }
        if (maturity >= 12) {
            return "Model 1: nearly ready — index between 12% and 25%; monitor humidity and rainfall.";
        }
        return "Model 1: low readiness index (<12%) — delay plucking and reassess after the next weather window.";
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> castList(Object value) {
        if (value instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        return List.of();
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
