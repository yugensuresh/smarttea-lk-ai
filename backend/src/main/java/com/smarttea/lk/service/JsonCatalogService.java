package com.smarttea.lk.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class JsonCatalogService {

    private final ObjectMapper objectMapper;

    public JsonCatalogService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> dashboardSeed() {
        return readMap("data/dashboard-seed.json");
    }

    public Map<String, Object> environmentalRisk() {
        return readMap("data/environmental-risk.json");
    }

    public Map<String, Object> pdvi() {
        return readMap("data/pdvi.json");
    }

    public Map<String, Object> pdviDefaults() {
        return readMap("data/pdvi-defaults.json");
    }

    public Map<String, Object> copyMap(Map<String, Object> source) {
        return deepCopy(source);
    }

    public Map<String, Object> diseaseModelMeta() {
        return readMap("data/disease-model.json");
    }

    public Map<String, Object> severityModelMeta() {
        return readMap("data/severity-model.json");
    }

    public Map<String, Object> harvestDefaults() {
        return readMap("data/harvest-defaults.json");
    }

    public Map<String, Object> intelDefaults() {
        return readMap("data/intel-defaults.json");
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> microClimateForecastDemo() {
        Object value = harvestDefaults().get("microClimateForecastDemo");
        if (value instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> dashboard(int days) {
        Map<String, Object> seed = deepCopy(dashboardSeed());
        List<Map<String, Object>> trend = (List<Map<String, Object>>) seed.get("trend");
        if (trend != null && days > 0) {
            int maxDay = trend.stream()
                    .mapToInt(point -> ((Number) point.get("day")).intValue())
                    .max()
                    .orElse(days);
            int minDay = Math.max(1, maxDay - days + 1);
            List<Map<String, Object>> trimmed = trend.stream()
                    .filter(point -> ((Number) point.get("day")).intValue() >= minDay)
                    .collect(Collectors.toList());
            seed.put("trend", trimmed);
        }
        seed.put("telemetryLive", true);
        return seed;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> alerts(String estate, String query) {
        Map<String, Object> seed = dashboardSeed();
        List<Map<String, Object>> alerts = (List<Map<String, Object>>) seed.get("alerts");
        if (alerts == null) {
            return List.of();
        }
        return alerts.stream()
                .filter(alert -> matchesEstate(alert, estate))
                .filter(alert -> matchesQuery(alert, query))
                .map(this::deepCopy)
                .collect(Collectors.toList());
    }

    private boolean matchesEstate(Map<String, Object> alert, String estate) {
        if (estate == null || estate.isBlank()) {
            return true;
        }
        Object value = alert.get("estate");
        return value != null && estate.equalsIgnoreCase(String.valueOf(value));
    }

    private boolean matchesQuery(Map<String, Object> alert, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }
        String needle = query.toLowerCase();
        return containsIgnoreCase(alert.get("title"), needle)
                || containsIgnoreCase(alert.get("place"), needle)
                || containsIgnoreCase(alert.get("estate"), needle);
    }

    private boolean containsIgnoreCase(Object haystack, String needle) {
        return haystack != null && String.valueOf(haystack).toLowerCase().contains(needle);
    }

    private Map<String, Object> readMap(String classpathLocation) {
        try (InputStream in = new ClassPathResource(classpathLocation).getInputStream()) {
            return objectMapper.readValue(in, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load " + classpathLocation, ex);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> deepCopy(Map<String, Object> source) {
        return objectMapper.convertValue(source, new TypeReference<LinkedHashMap<String, Object>>() {});
    }
}
