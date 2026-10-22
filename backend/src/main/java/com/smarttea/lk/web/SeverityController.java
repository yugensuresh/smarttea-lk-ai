package com.smarttea.lk.web;

import com.smarttea.lk.service.JsonCatalogService;
import com.smarttea.lk.service.SeverityPredictionService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SeverityController {

    private final JsonCatalogService catalog;
    private final SeverityPredictionService severityService;

    public SeverityController(JsonCatalogService catalog, SeverityPredictionService severityService) {
        this.catalog = catalog;
        this.severityService = severityService;
    }

    @GetMapping("/models/severity")
    public Map<String, Object> severityModelMeta() {
        return catalog.severityModelMeta();
    }

    @PostMapping("/predict/severity")
    public Map<String, Object> predictSeverity(@RequestBody(required = false) Map<String, Object> payload) {
        return severityService.predict(payload);
    }
}
