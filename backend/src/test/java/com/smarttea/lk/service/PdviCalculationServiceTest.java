package com.smarttea.lk.service;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import org.junit.jupiter.api.Test;

class PdviCalculationServiceTest {

    private final PdviCalculationService service = new PdviCalculationService();

    @Test
    void scoreChangesWhenSeverityProbabilitiesChange() {
        Map<String, Object> low =
                service.calculate(
                        "Blister_Blight",
                        0.7,
                        Map.of("Low", 0.7, "Moderate", 0.2, "High", 0.05, "Severe", 0.05));
        Map<String, Object> high =
                service.calculate(
                        "Blister_Blight",
                        0.7,
                        Map.of("Low", 0.05, "Moderate", 0.05, "High", 0.1, "Severe", 0.8));

        double lowScore = ((Number) low.get("pdviScore")).doubleValue();
        double highScore = ((Number) high.get("pdviScore")).doubleValue();
        assertNotEquals(lowScore, highScore);
    }

    @Test
    void scoreChangesWhenConfidenceChanges() {
        Map<String, Object> probs =
                Map.of("Low", 0.05, "Moderate", 0.25, "High", 0.1, "Severe", 0.6);
        Map<String, Object> lowerConf = service.calculate("Blister_Blight", 0.5, probs);
        Map<String, Object> higherConf = service.calculate("Blister_Blight", 0.9, probs);

        double a = ((Number) lowerConf.get("pdviScore")).doubleValue();
        double b = ((Number) higherConf.get("pdviScore")).doubleValue();
        assertNotEquals(a, b);
        assertEquals(0.0, ((Number) service.calculate("healthy", 0.9, probs).get("pdviScore")).doubleValue());
    }
}
