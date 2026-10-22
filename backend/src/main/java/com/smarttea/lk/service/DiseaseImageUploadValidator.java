package com.smarttea.lk.service;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** Safe bounds for disease upload endpoints (aligned with frontend 5 MB cap). */
public final class DiseaseImageUploadValidator {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    public static final int MAX_EDGE_PX = 8192;
    public static final long MAX_PIXELS = 16L * 1024 * 1024;

    private static final Set<String> ALLOWED_EXT = Set.of(".jpg", ".jpeg", ".png");

    private DiseaseImageUploadValidator() {}

    public record DecodedImage(BufferedImage image, int width, int height, long sizeBytes) {}

    public static void validatePresenceAndSize(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required multipart field: file");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Image must be 5 MB or smaller.");
        }
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file must have a filename.");
        }
        String ext = extensionOf(name);
        if (!ALLOWED_EXT.contains(ext)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Accepted formats: JPG, JPEG, and PNG.");
        }
    }

    public static DecodedImage decodeAndValidateDimensions(MultipartFile file) {
        validatePresenceAndSize(file);
        try (InputStream in = file.getInputStream()) {
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Could not decode image. Upload a valid JPG or PNG file.");
            }
            int width = image.getWidth();
            int height = image.getHeight();
            if (width <= 0 || height <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image dimensions.");
            }
            if (width > MAX_EDGE_PX || height > MAX_EDGE_PX) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Image dimensions exceed the maximum allowed "
                                + MAX_EDGE_PX
                                + " px per side.");
            }
            long pixels = (long) width * (long) height;
            if (pixels > MAX_PIXELS) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Image pixel count exceeds the maximum allowed size.");
            }
            return new DecodedImage(image, width, height, file.getSize());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read uploaded image.");
        }
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0) {
            return "";
        }
        return filename.substring(dot).toLowerCase(Locale.ROOT);
    }
}
