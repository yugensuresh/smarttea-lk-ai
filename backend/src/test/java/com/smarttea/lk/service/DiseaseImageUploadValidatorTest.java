package com.smarttea.lk.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class DiseaseImageUploadValidatorTest {

    @Test
    void rejectsEmptyUpload() {
        MockMultipartFile empty = new MockMultipartFile("file", "leaf.png", "image/png", new byte[0]);
        assertThrows(ResponseStatusException.class, () -> DiseaseImageUploadValidator.validatePresenceAndSize(empty));
    }

    @Test
    void rejectsUnsupportedExtension() {
        MockMultipartFile gif =
                new MockMultipartFile("file", "x.gif", "image/gif", new byte[] {1, 2, 3});
        assertThrows(ResponseStatusException.class, () -> DiseaseImageUploadValidator.validatePresenceAndSize(gif));
    }

    @Test
    void decodesValidPng() throws Exception {
        MockMultipartFile png = pngFile("specimen.png", 32, 32);
        DiseaseImageUploadValidator.DecodedImage decoded =
                DiseaseImageUploadValidator.decodeAndValidateDimensions(png);
        assertEquals(32, decoded.width());
        assertEquals(32, decoded.height());
    }

    private static MockMultipartFile pngFile(String name, int w, int h) throws Exception {
        BufferedImage image = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(20, 100, 40));
        g.fillRect(0, 0, w, h);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return new MockMultipartFile("file", name, "image/png", out.toByteArray());
    }
}
