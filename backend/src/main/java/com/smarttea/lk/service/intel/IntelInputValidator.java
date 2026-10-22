package com.smarttea.lk.service.intel;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class IntelInputValidator {

    private IntelInputValidator() {}

    public static void requireFeatures(Map<String, Object> features, List<String> requiredKeys, String modelLabel) {
        if (features == null || features.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, modelLabel + ": features object is required");
        }
        List<String> missing = new ArrayList<>();
        List<String> invalid = new ArrayList<>();
        for (String key : requiredKeys) {
            if (!features.containsKey(key)) {
                missing.add(key);
                continue;
            }
            if (!isFiniteNumber(features.get(key))) {
                invalid.add(key);
            }
        }
        if (!missing.isEmpty() || !invalid.isEmpty()) {
            StringBuilder msg = new StringBuilder(modelLabel).append(": ");
            if (!missing.isEmpty()) {
                msg.append("missing: ").append(String.join(", ", missing));
            }
            if (!invalid.isEmpty()) {
                if (!missing.isEmpty()) {
                    msg.append("; ");
                }
                msg.append("invalid: ").append(String.join(", ", invalid));
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg.toString());
        }
    }

    static boolean isFiniteNumber(Object value) {
        if (value == null || value instanceof Boolean) {
            return false;
        }
        if (value instanceof Number number) {
            double n = number.doubleValue();
            return Double.isFinite(n);
        }
        if (value instanceof String text) {
            String stripped = text.trim();
            if (stripped.isEmpty()) {
                return false;
            }
            try {
                return Double.isFinite(Double.parseDouble(stripped));
            } catch (NumberFormatException ex) {
                return false;
            }
        }
        return false;
    }
}
