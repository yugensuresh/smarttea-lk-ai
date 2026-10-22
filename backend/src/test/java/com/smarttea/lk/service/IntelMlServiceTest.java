package com.smarttea.lk.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.smarttea.lk.config.SmartteaMlProperties;
import com.smarttea.lk.service.member01.PythonMember01Client;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class IntelMlServiceTest {

    @Mock private JsonCatalogService catalog;
    @Mock private PythonMember01Client mlClient;

    private SmartteaMlProperties mlProperties;
    private IntelMlService service;

    @BeforeEach
    void setUp() {
        mlProperties = new SmartteaMlProperties();
        mlProperties.setEnabled(false);
        service = new IntelMlService(catalog, mlProperties, mlClient);
    }

    @Test
    void predictTeaQualityWhenMlDisabledIsUnavailable() {
        assertThrows(ResponseStatusException.class, () -> service.predictTeaQuality(validTeaFeatures()));
    }

    @Test
    void predictQualityAndStiiUsesBothFeatureMapsWhenMlEnabled() {
        mlProperties.setEnabled(true);
        when(mlClient.invokeTask(eq("tea-quality"), any()))
                .thenReturn(
                        Map.of(
                                "ok", true,
                                "teaGrade", "A",
                                "inferenceEngine", "sklearn-gbc-tea-quality-v1",
                                "probabilities", List.of(Map.of("grade", "A", "probability", 0.9))));
        when(mlClient.invokeTask(eq("sustainability"), any()))
                .thenReturn(
                        Map.of(
                                "ok", true,
                                "sustainabilityScore", 88.0,
                                "performanceLabel", "Excellent",
                                "inferenceEngine", "sklearn-rf-sustainability-v1"));
        when(mlClient.invokeTask(eq("stii"), any()))
                .thenReturn(
                        Map.of(
                                "ok", true,
                                "quality_score_equiv", 92.5,
                                "stii_score", 90.25,
                                "performance_tier", "Excellent",
                                "inferenceEngine", "stii-formula-v1"));

        Map<String, Object> result = service.predictQualityAndStii(validTeaFeatures(), validSustainFeatures());
        assertEquals(true, result.get("ok"));
        assertEquals(92.5, result.get("qualityScoreEquivalent"));
        assertEquals(90.25, result.get("stiiScore"));
        assertEquals("Excellent", result.get("performanceTier"));
    }

    @Test
    void sustainabilityPageWhenMlDisabledMarksUnavailable() {
        when(catalog.intelDefaults())
                .thenReturn(Map.of("sustainabilityFeatures", validSustainFeatures()));
        Map<String, Object> page = service.sustainabilityAssessmentPage();
        assertFalse((Boolean) page.get("ok"));
        @SuppressWarnings("unchecked")
        Map<String, Object> score = (Map<String, Object>) page.get("performanceScore");
        assertEquals(null, score.get("value"));
    }

    private static Map<String, Object> validTeaFeatures() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("temperature_c", 24);
        m.put("humidity_pct", 85);
        m.put("rainfall_mm", 14);
        m.put("soil_moisture_pct", 42);
        m.put("sunshine_hours", 6.5);
        m.put("elevation_m", 1200);
        return m;
    }

    private static Map<String, Object> validSustainFeatures() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("elevation_m", 1200);
        m.put("soil_moisture_pct", 42);
        m.put("soil_ph", 5.5);
        m.put("rainfall_mm", 14);
        m.put("temperature_mean_c", 24);
        m.put("humidity_mean_pct", 85);
        m.put("et0_mm", 4.2);
        m.put("production_kg_per_day_monthly_average", 850);
        return m;
    }
}
