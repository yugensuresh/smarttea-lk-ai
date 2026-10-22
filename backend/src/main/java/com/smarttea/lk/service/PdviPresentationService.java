package com.smarttea.lk.service;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PdviPresentationService {

    private final JsonCatalogService catalog;
    private final PdviCalculationService calculationService;

    public PdviPresentationService(JsonCatalogService catalog, PdviCalculationService calculationService) {
        this.catalog = catalog;
        this.calculationService = calculationService;
    }

    public Map<String, Object> getPdviPage() {
        Map<String, Object> defaults = catalog.pdviDefaults();
        return buildPage(defaults, null);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> predictPdvi(Map<String, Object> body) {
        Map<String, Object> inputs = body != null ? body : catalog.pdviDefaults();
        return buildPage(inputs, body);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildPage(Map<String, Object> inputs, Map<String, Object> requestEcho) {
        Map<String, Object> page = catalog.copyMap(catalog.pdvi());

        String disease = stringField(inputs, "model01Disease", "model01_disease");
        double confidence =
                numberField(inputs, 0.7, "model01Confidence", "model01_confidence", "confidence");
        Map<String, ?> severity =
                (Map<String, ?>) inputs.getOrDefault("severityProbabilities", inputs.get("severity_probabilities"));

        Map<String, Object> computed = calculationService.calculate(disease, confidence, severity);

        Map<String, Object> meta = castMap(page.get("meta"));
        double score = ((Number) computed.get("score")).doubleValue();
        meta.put("score", (int) Math.round(score));
        meta.put("pdviScoreExact", computed.get("pdviScore"));
        meta.put("band", computed.get("band"));
        meta.put("inferenceEngine", computed.get("inferenceEngine"));
        meta.put("formulaStatus", computed.get("status"));
        meta.remove("delta");
        meta.remove("telemetryStations");
        meta.remove("telemetryUpdated");
        page.put("meta", meta);
        page.put("catalogIllustrative", true);
        page.put("calculation", computed);
        if (requestEcho != null) {
            page.put("request", requestEcho);
        }
        return page;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return new LinkedHashMap<>();
    }

    private static String stringField(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object v = map.get(key);
            if (v != null && !String.valueOf(v).isBlank()) {
                return String.valueOf(v);
            }
        }
        return "Blister_Blight";
    }

    private static double numberField(Map<String, Object> map, double fallback, String... keys) {
        for (String key : keys) {
            Object v = map.get(key);
            if (v instanceof Number number) {
                double value = number.doubleValue();
                return value > 1 ? value / 100.0 : value;
            }
        }
        return fallback;
    }
}
