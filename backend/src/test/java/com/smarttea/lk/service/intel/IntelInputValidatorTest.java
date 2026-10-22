package com.smarttea.lk.service.intel;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class IntelInputValidatorTest {

    @Test
    void acceptsValidTeaQualityFeatures() {
        Map<String, Object> features =
                Map.of(
                        "temperature_c", 24,
                        "humidity_pct", 85,
                        "rainfall_mm", 14,
                        "soil_moisture_pct", 42,
                        "sunshine_hours", 6.5,
                        "elevation_m", 1200);
        assertDoesNotThrow(
                () -> IntelInputValidator.requireFeatures(features, IntelFeatureSets.TEA_QUALITY, "Model 01"));
    }

    @Test
    void rejectsMissingTeaQualityFeature() {
        Map<String, Object> features =
                Map.of(
                        "temperature_c", 24,
                        "humidity_pct", 85,
                        "rainfall_mm", 14,
                        "soil_moisture_pct", 42,
                        "sunshine_hours", 6.5);
        assertThrows(
                ResponseStatusException.class,
                () -> IntelInputValidator.requireFeatures(features, IntelFeatureSets.TEA_QUALITY, "Model 01"));
    }

    @Test
    void rejectsNonNumericFeature() {
        Map<String, Object> features =
                Map.of(
                        "temperature_c", "hot",
                        "humidity_pct", 85,
                        "rainfall_mm", 14,
                        "soil_moisture_pct", 42,
                        "sunshine_hours", 6.5,
                        "elevation_m", 1200);
        assertThrows(
                ResponseStatusException.class,
                () -> IntelInputValidator.requireFeatures(features, IntelFeatureSets.TEA_QUALITY, "Model 01"));
    }
}
