package com.smarttea.lk.web;

import com.smarttea.lk.service.JsonCatalogService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final JsonCatalogService catalog;

    public DashboardController(JsonCatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public Map<String, Object> getDashboard(@RequestParam(defaultValue = "30") int days) {
        int window = Math.max(1, Math.min(days, 365));
        return catalog.dashboard(window);
    }
}
