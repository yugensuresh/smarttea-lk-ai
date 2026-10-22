package com.smarttea.lk.web;

import com.smarttea.lk.service.JsonCatalogService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertsController {

    private final JsonCatalogService catalog;

    public AlertsController(JsonCatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public List<Map<String, Object>> listAlerts(
            @RequestParam(required = false) String estate, @RequestParam(required = false) String q) {
        return catalog.alerts(estate, q);
    }
}
