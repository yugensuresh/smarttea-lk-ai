package com.smarttea.lk.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Model 03 PDVI formula from Member01/PDVI/Model03_PDVI_Final.ipynb */
@Service
public class PdviCalculationService {

    private static final Map<String, Double> SEVERITY_WEIGHTS =
            Map.of("Low", 0.0, "Moderate", 1.0, "High", 2.0, "Severe", 3.0);

    @SuppressWarnings("unchecked")
    public Map<String, Object> calculate(
            String model01Disease, double model01Confidence, Map<String, ?> severityProbabilities) {
        if (model01Confidence < 0 || model01Confidence > 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Model 01 confidence must be between 0 and 1.");
        }
        String disease = normalizeDisease(model01Disease);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("model01Disease", model01Disease);
        result.put("model01Confidence", round(model01Confidence, 4));

        if ("healthy".equals(disease)) {
            result.put("expectedSeverity", null);
            result.put("pdviScore", 0.0);
            result.put("score", 0.0);
            result.put("status", "Provisional zero: Model 01 predicted Healthy");
            result.put(
                    "warning",
                    "Requires field validation; not proof of zero plantation risk.");
            return result;
        }

        if (severityProbabilities == null || severityProbabilities.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Model 02 severity probabilities are required.");
        }

        Map<String, Double> probabilities = new LinkedHashMap<>();
        for (String label : SEVERITY_WEIGHTS.keySet()) {
            Object raw = severityProbabilities.get(label);
            if (raw == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Severity probabilities must include: Low, Moderate, High, Severe");
            }
            double value = toDouble(raw);
            if (value < 0 || value > 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Severity probabilities must be between 0 and 1.");
            }
            probabilities.put(label, value);
        }

        double total = probabilities.values().stream().mapToDouble(Double::doubleValue).sum();
        if (Math.abs(total - 1.0) > 0.01) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Severity probabilities must sum to approximately 1.0; got " + total);
        }

        double expectedSeverity =
                probabilities.entrySet().stream()
                                .mapToDouble(e -> e.getValue() * SEVERITY_WEIGHTS.get(e.getKey()))
                                .sum()
                        / 3.0;

        double pdvi = 100.0 * Math.sqrt(model01Confidence * expectedSeverity);
        pdvi = Math.min(100.0, Math.max(0.0, pdvi));

        result.put("model02SeverityProbabilities", probabilities);
        result.put("expectedSeverity", round(expectedSeverity, 4));
        result.put("pdviScore", round(pdvi, 2));
        result.put("score", round(pdvi, 2));
        result.put("band", bandForScore(pdvi));
        result.put("status", "Calculated — provisional research index");
        result.put(
                "warning",
                "Not a calibrated disease probability or validated field-risk score.");
        result.put("inferenceEngine", "pdvi-formula-v1");
        return result;
    }

    private static String bandForScore(double score) {
        if (score >= 70) {
            return "Substantial Risk";
        }
        if (score >= 45) {
            return "Moderate Risk";
        }
        if (score >= 20) {
            return "Low Risk";
        }
        return "Minimal Risk";
    }

    private static String normalizeDisease(String model01Disease) {
        if (model01Disease == null) {
            return "";
        }
        return model01Disease.trim().toLowerCase(Locale.ROOT).replace(" ", "_");
    }

    private static double toDouble(Object raw) {
        if (raw instanceof Number number) {
            return number.doubleValue();
        }
        return Double.parseDouble(String.valueOf(raw));
    }

    private static double round(double value, int places) {
        double scale = Math.pow(10, places);
        return Math.round(value * scale) / scale;
    }
}
