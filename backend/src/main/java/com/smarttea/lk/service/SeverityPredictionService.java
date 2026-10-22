package com.smarttea.lk.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

/** Severity estimate from Model 01 context (replace with segmentation model when available). */
@Service
public class SeverityPredictionService {

    public Map<String, Object> predict(Map<String, Object> payload) {
        Map<String, Object> model01 = extractModel01(payload);
        String classId = stringField(model01, "classId", "class_id");
        double confidence = numberField(model01, "confidence", "probability", "confidence_score");
        if (confidence <= 1.0 && confidence > 0) {
            confidence *= 100.0;
        }

        SeverityEstimate estimate = estimate(classId, confidence);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("severity", estimate.level());
        body.put("severityClass", estimate.level());
        body.put("level", estimate.level());
        body.put("affectedAreaPct", estimate.affectedPct());
        body.put("affected_area_pct", estimate.affectedPct());
        body.put("explanation", estimate.explanation());
        body.put("inferenceEngine", "java-context-heuristic-v1");
        body.put("model01Context", model01.isEmpty() ? null : model01);
        return body;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> extractModel01(Map<String, Object> payload) {
        if (payload == null) {
            return Map.of();
        }
        Object ctx = payload.get("model01Context");
        if (ctx == null) {
            ctx = payload.get("model01_context");
        }
        if (ctx instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private static SeverityEstimate estimate(String classId, double confidencePct) {
        if (classId == null || classId.isBlank() || "healthy".equalsIgnoreCase(classId)) {
            return new SeverityEstimate(
                    "Minimal",
                    roundPct(2.0),
                    "No pathology class was flagged in Model 01 context. Visible lesion load appears negligible on this specimen.");
        }
        double conf = clamp(confidencePct, 5, 99);
        double base = switch (classId.toLowerCase(Locale.ROOT)) {
            case "blister" -> 28;
            case "grey" -> 22;
            case "redrust" -> 18;
            default -> 20;
        };
        double affected = base + (conf - 50) * 0.35;
        affected = clamp(affected, 8, 78);

        String level;
        if (affected < 15) {
            level = "Low";
        } else if (affected < 32) {
            level = "Moderate";
        } else if (affected < 55) {
            level = "High";
        } else {
            level = "Critical";
        }

        String label = classId;
        String explanation =
                String.format(
                        Locale.US,
                        "Heuristic severity for %s pathology using Model 01 confidence (%.1f%%). "
                                + "Estimated affected leaf area ~%.1f%% — validate in the field before treatment.",
                        label,
                        conf,
                        affected);

        return new SeverityEstimate(level, roundPct(affected), explanation);
    }

    private static String stringField(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object v = map.get(key);
            if (v != null && !String.valueOf(v).isBlank()) {
                return String.valueOf(v);
            }
        }
        return null;
    }

    private static double numberField(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object v = map.get(key);
            if (v instanceof Number n) {
                return n.doubleValue();
            }
            if (v != null) {
                try {
                    return Double.parseDouble(String.valueOf(v));
                } catch (NumberFormatException ignored) {
                    /* try next key */
                }
            }
        }
        return 55.0;
    }

    private static double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }

    private static double roundPct(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private record SeverityEstimate(String level, double affectedPct, String explanation) {}
}
