package com.smarttea.lk.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

class DiseaseSpecimenValidationIntegrationTest {

    @SpringBootTest
    @AutoConfigureMockMvc
    @TestPropertySource(
            properties = {
                "smarttea.ml.enabled=false",
                "smarttea.ml.specimen-validator-mode=test-reject"
            })
    static class RejectModeTest {

        @Autowired
        private MockMvc mockMvc;

        @Test
        void rejectModeDoesNotRunModel01() throws Exception {
            MockMultipartFile file = png("Logo.png");
            mockMvc.perform(multipart("/api/v1/predict/disease").file(file))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.resultState").value("INVALID_SPECIMEN"))
                    .andExpect(jsonPath("$.diseaseClassificationRan").value(false))
                    .andExpect(jsonPath("$.classId").doesNotExist())
                    .andExpect(jsonPath("$.inferenceEngine").doesNotExist())
                    .andExpect(jsonPath("$.probabilities").doesNotExist());
        }
    }

    @SpringBootTest
    @AutoConfigureMockMvc
    @TestPropertySource(
            properties = {
                "smarttea.ml.enabled=false",
                "smarttea.ml.specimen-validator-mode=test-accept"
            })
    static class AcceptModeTest {

        @Autowired
        private MockMvc mockMvc;

        @Test
        void acceptModeRunsModel01AsVerified() throws Exception {
            MockMultipartFile file = png("leaf.jpg");
            mockMvc.perform(multipart("/api/v1/predict/disease").file(file))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.resultState").value("SPECIMEN_VERIFIED"))
                    .andExpect(jsonPath("$.specimenSuitabilityVerified").value(true))
                    .andExpect(jsonPath("$.diseaseClassificationRan").value(true))
                    .andExpect(jsonPath("$.classId").exists());
        }
    }

    private static MockMultipartFile png(String name) throws Exception {
        BufferedImage image = new BufferedImage(48, 48, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(34, 120, 45));
        g.fillRect(0, 0, 48, 48);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return new MockMultipartFile("file", name, "image/png", out.toByteArray());
    }
}
