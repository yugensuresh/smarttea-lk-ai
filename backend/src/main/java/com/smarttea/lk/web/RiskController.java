package com.smarttea.lk.web;

import com.smarttea.lk.service.EnvironmentalRiskPredictionService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class RiskController {

    private final EnvironmentalRiskPredictionService riskService;

    public RiskController(EnvironmentalRiskPredictionService riskService) {
        this.riskService = riskService;
    }

    @GetMapping("/risk/environmental")
    public Map<String, Object> getEnvironmentalRisk() {
        return riskService.getSnapshot();
    }

    /** Model 02 — HistGradientBoostingClassifier (joblib). */
    @PostMapping("/predict/environmental-risk")
    public Map<String, Object> predictEnvironmentalRisk(@RequestBody(required = false) Map<String, Object> payload) {
        return riskService.predict(payload);
    }
}
