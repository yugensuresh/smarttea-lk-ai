package com.smarttea.lk.web;

import com.smarttea.lk.service.PdviPresentationService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PdviController {

    private final PdviPresentationService pdviService;

    public PdviController(PdviPresentationService pdviService) {
        this.pdviService = pdviService;
    }

    @GetMapping("/pdvi")
    public Map<String, Object> getPdvi() {
        return pdviService.getPdviPage();
    }

    /** Model 03 PDVI formula using Model 01 + severity probability inputs. */
    @PostMapping("/predict/pdvi")
    public Map<String, Object> predictPdvi(@RequestBody(required = false) Map<String, Object> payload) {
        return pdviService.predictPdvi(payload);
    }
}
