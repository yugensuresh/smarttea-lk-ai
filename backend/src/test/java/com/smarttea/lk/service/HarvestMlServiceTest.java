package com.smarttea.lk.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class HarvestMlServiceTest {

    @Test
    void envContextFromFields_usesMeanOfMlFeatures() {
        Map<String, Object> fieldA = new LinkedHashMap<>();
        fieldA.put(
                "mlFeatures",
                Map.of("temperature_c", 20, "humidity_percent", 80, "rainfall_mm", 50, "elevation_m", 900));
        Map<String, Object> fieldB = new LinkedHashMap<>();
        fieldB.put(
                "mlFeatures",
                Map.of("temperature_c", 26, "humidity_percent", 70, "rainfall_mm", 40, "elevation_m", 1100));

        Map<String, Object> ctx = HarvestMlService.envContextFromFields(List.of(fieldA, fieldB));

        assertEquals("23.0°C", ctx.get("avgTemp"));
        assertEquals("75%", ctx.get("humidity"));
        assertTrue(Boolean.TRUE.equals(ctx.get("illustrativeTelemetry")));
        assertTrue(String.valueOf(ctx.get("telemetryNote")).contains("catalog mlFeatures"));
    }

    @Test
    void readinessInferenceSummary_countsLiveAndFailed() {
        Map<String, Object> live = Map.of("prediction", Map.of("inferenceEngine", "xgb-harvest-readiness-v1"));
        Map<String, Object> failed =
                Map.of("prediction", Map.of("inferenceEngine", "error", "error", "ML stdout is not valid JSON"));

        Map<String, Object> summary =
                HarvestMlService.readinessInferenceSummary(List.of(live, failed));

        assertEquals(1, summary.get("liveFieldPredictions"));
        assertEquals(1, summary.get("failedFieldPredictions"));
        assertEquals(2, summary.get("fieldCount"));
    }
}
