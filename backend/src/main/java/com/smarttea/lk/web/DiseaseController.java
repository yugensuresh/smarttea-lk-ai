package com.smarttea.lk.web;

import com.smarttea.lk.service.DiseasePredictionService;
import com.smarttea.lk.service.JsonCatalogService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
public class DiseaseController {

    private final JsonCatalogService catalog;
    private final DiseasePredictionService predictionService;

    public DiseaseController(JsonCatalogService catalog, DiseasePredictionService predictionService) {
        this.catalog = catalog;
        this.predictionService = predictionService;
    }

    @GetMapping("/models/disease")
    public Map<String, Object> diseaseModelMeta() {
        return catalog.diseaseModelMeta();
    }

    @PostMapping("/predict/disease")
    public Map<String, Object> predictDisease(
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return predictionService.predict(file);
    }
}
