package com.smarttea.lk.web;

import com.smarttea.lk.service.HarvestMlService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/harvest")
public class HarvestController {

    private final HarvestMlService harvestService;

    public HarvestController(HarvestMlService harvestService) {
        this.harvestService = harvestService;
    }

    @GetMapping("/readiness")
    public Map<String, Object> readinessPage() {
        return harvestService.readinessPage();
    }

    @GetMapping("/forecasting")
    public Map<String, Object> forecastingPage() {
        return harvestService.forecastingPage();
    }

    @GetMapping("/climate-risk")
    public Map<String, Object> climateRiskPage() {
        return harvestService.climateRiskPage();
    }

    @GetMapping("/thrri")
    public Map<String, Object> thrriPage() {
        return harvestService.thrriPage();
    }

    @PostMapping("/predict/readiness")
    public Map<String, Object> predictReadiness(@RequestBody Map<String, Object> body) {
        return harvestService.predictReadiness(castFeatures(body));
    }

    @PostMapping("/predict/yield")
    public Map<String, Object> predictYield(@RequestBody Map<String, Object> body) {
        return harvestService.predictYield(castFeatures(body));
    }

    @PostMapping("/predict/climate-risk")
    public Map<String, Object> predictClimate(@RequestBody Map<String, Object> body) {
        return harvestService.predictClimate(castFeatures(body));
    }

    @PostMapping("/predict/thrri")
    public Map<String, Object> predictThrri(@RequestBody Map<String, Object> body) {
        return harvestService.predictThrri(body != null ? body : Map.of());
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castFeatures(Map<String, Object> body) {
        if (body == null) {
            return Map.of();
        }
        Object nested = body.get("features");
        if (nested instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return body;
    }
}
