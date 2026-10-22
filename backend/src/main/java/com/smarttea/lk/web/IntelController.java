package com.smarttea.lk.web;

import com.smarttea.lk.service.IntelMlService;
import com.smarttea.lk.service.intel.IntelFeatureSets;
import com.smarttea.lk.service.intel.IntelInputValidator;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/intel")
public class IntelController {

    private final IntelMlService intelService;

    public IntelController(IntelMlService intelService) {
        this.intelService = intelService;
    }

    @GetMapping("/overview")
    public Map<String, Object> intelOverview() {
        return intelService.intelOverview();
    }

    @GetMapping("/sustainability-assessment")
    public Map<String, Object> sustainabilityAssessment() {
        return intelService.sustainabilityAssessmentPage();
    }

    @PostMapping("/predict/tea-quality")
    public Map<String, Object> predictTeaQuality(@RequestBody Map<String, Object> body) {
        Map<String, Object> features = IntelRequestBodies.teaQualityFeatures(body);
        return intelService.predictTeaQuality(features);
    }

    @PostMapping("/predict/sustainability")
    public Map<String, Object> predictSustainability(@RequestBody Map<String, Object> body) {
        Map<String, Object> features = IntelRequestBodies.sustainabilityFeatures(body);
        return intelService.predictSustainability(features);
    }

    @PostMapping("/predict/stii")
    public Map<String, Object> predictStii(@RequestBody Map<String, Object> body) {
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        String grade = stringField(body, "teaGrade", "tea_grade");
        Object score = body.get("sustainabilityScore");
        if (score == null) {
            score = body.get("sustainability_score");
        }
        if (score == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "STII: sustainabilityScore is required");
        }
        if (!(score instanceof Number number) || !Double.isFinite(number.doubleValue())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "STII: sustainabilityScore must be finite");
        }
        return intelService.predictStii(grade, number.doubleValue());
    }

    @PostMapping("/predict/quality-stii")
    public Map<String, Object> predictQualityStii(@RequestBody Map<String, Object> body) {
        if (body == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Request must include teaQualityFeatures and sustainabilityFeatures");
        }
        Map<String, Object> qualityFeatures = IntelRequestBodies.teaQualityFeatures(body);
        Map<String, Object> sustainabilityFeatures = IntelRequestBodies.sustainabilityFeatures(body);
        IntelInputValidator.requireFeatures(qualityFeatures, IntelFeatureSets.TEA_QUALITY, "Model 01 tea quality");
        IntelInputValidator.requireFeatures(
                sustainabilityFeatures, IntelFeatureSets.SUSTAINABILITY, "Model 02 sustainability");
        return intelService.predictQualityAndStii(qualityFeatures, sustainabilityFeatures);
    }

    private static String stringField(Map<String, Object> body, String... keys) {
        for (String key : keys) {
            Object value = body.get(key);
            if (value != null && !String.valueOf(value).isBlank()) {
                return String.valueOf(value);
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "STII: teaGrade is required");
    }

}

/** Intel POST body helpers — quality-stii uses explicit feature blocks. */
final class IntelRequestBodies {

    private IntelRequestBodies() {}

    @SuppressWarnings("unchecked")
    static Map<String, Object> teaQualityFeatures(Map<String, Object> body) {
        if (body == null) {
            return Map.of();
        }
        Object direct = body.get("teaQualityFeatures");
        if (direct instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        Object legacy = body.get("features");
        if (legacy instanceof Map<?, ?> map && !body.containsKey("sustainabilityFeatures")) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> sustainabilityFeatures(Map<String, Object> body) {
        if (body == null) {
            return Map.of();
        }
        Object direct = body.get("sustainabilityFeatures");
        if (direct instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        Object legacy = body.get("features");
        if (legacy instanceof Map<?, ?> map && !body.containsKey("teaQualityFeatures")) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }
}

/** Shared feature extraction for harvest POST bodies (legacy flat map). */
class HarvestControllerFeatures {
    @SuppressWarnings("unchecked")
    static Map<String, Object> castFeatures(Map<String, Object> body) {
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
