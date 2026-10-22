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

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "smarttea.ml.enabled=false")
class DiseasePredictUploadIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void missingFilePartReturns400() throws Exception {
        mockMvc.perform(multipart("/api/v1/predict/disease"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Missing required multipart field: file"));
    }

    @Test
    void emptyFileReturns400() throws Exception {
        MockMultipartFile empty = new MockMultipartFile("file", "leaf.png", "image/png", new byte[0]);
        mockMvc.perform(multipart("/api/v1/predict/disease").file(empty))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Missing required multipart field: file"));
    }

    @Test
    void nonImageContentTypeReturns400() throws Exception {
        MockMultipartFile text =
                new MockMultipartFile("file", "notes.txt", "text/plain", "not an image".getBytes());
        mockMvc.perform(multipart("/api/v1/predict/disease").file(text))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Uploaded file must be an image."));
    }

    @Test
    void corruptImageBytesReturn400() throws Exception {
        MockMultipartFile corrupt =
                new MockMultipartFile("file", "bad.png", "image/png", new byte[] {0, 1, 2, 3, 4});
        mockMvc.perform(multipart("/api/v1/predict/disease").file(corrupt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Could not decode image. Use JPG or PNG."));
    }

    @Test
    void validPngRunsHeuristicWhenMlDisabled() throws Exception {
        MockMultipartFile png = png("leaf.png", 64, 64);
        mockMvc.perform(multipart("/api/v1/predict/disease").file(png))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inferenceEngine").value("java-rgb-heuristic-v1"))
                .andExpect(jsonPath("$.inferenceFallback").value(true))
                .andExpect(jsonPath("$.classId").exists());
    }

    private static MockMultipartFile png(String name, int w, int h) throws Exception {
        BufferedImage image = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(34, 120, 45));
        g.fillRect(0, 0, w, h);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return new MockMultipartFile("file", name, "image/png", out.toByteArray());
    }
}
