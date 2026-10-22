package com.smarttea.lk.service;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import com.smarttea.lk.config.SmartteaMlProperties;
import com.smarttea.lk.service.member01.PythonMember01Client;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** Model 01: Keras EfficientNet-B0 when ML is enabled; RGB heuristic fallback otherwise. */
@Service
public class DiseasePredictionService {

    private static final Logger log = LoggerFactory.getLogger(DiseasePredictionService.class);

    private final SmartteaMlProperties mlProperties;
    private final PythonMember01Client mlClient;

    private static final int INPUT = 224;
    /** Must match softmax index order in ml/member01_config.json and Keras export. */
    private static final List<String> CLASS_ORDER = List.of("blister", "grey", "redRust", "healthy");

    private static final Map<String, Map<String, String>> PATHOLOGY = Map.of(
            "blister",
                    Map.of(
                            "id", "blister",
                            "label", "Blister Blight",
                            "scientific", "Exobasidium vexans Massee",
                            "code", "INF-9821"),
            "grey",
                    Map.of(
                            "id", "grey",
                            "label", "Grey Blight",
                            "scientific", "Pestalotiopsis theae",
                            "code", "INF-7732"),
            "redRust",
                    Map.of(
                            "id", "redRust",
                            "label", "Red Rust",
                            "scientific", "Cephaleuros parasiticus",
                            "code", "INF-5520"),
            "healthy",
                    Map.of(
                            "id", "healthy",
                            "label", "Healthy",
                            "scientific", "Camellia sinensis (normal)",
                            "code", "OK-0000"));

    private static final Map<String, String> SUMMARIES = Map.of(
            "blister",
                    "Lesion patterns consistent with early blister blight on the adaxial leaf surface. Confirm with field scouting before treatment.",
            "grey",
                    "Grey blight–like necrotic spotting suggested on the specimen. Confirm with field scouting before treatment.",
            "redRust",
                    "Algal rust–like discolouration signatures flagged. Validate humidity and shade conditions on the block.",
            "healthy",
                    "No pathology class exceeded the infection threshold. Continue routine monitoring on this block.");

    private static final Map<String, List<String>> NEXT_STEPS = Map.of(
            "blister",
                    List.of(
                            "Isolate affected rows and log block ID in the supervisor queue.",
                            "Schedule copper-based protective spray within 24 hours if field conditions match.",
                            "Re-scout after the next cool, damp night cycle."),
            "grey",
                    List.of(
                            "Increase airflow assessment on dense canopy sectors.",
                            "Review recent rainfall and plan targeted fungicide window with agronomy lead.",
                            "Collect a follow-up specimen in 48 hours for comparison."),
            "redRust",
                    List.of(
                            "Inspect shaded zones for rust spread on lower leaf surfaces.",
                            "Trim overhead shade where moisture retention is high.",
                            "Monitor neighbouring blocks for similar algal rust signatures."),
            "healthy",
                    List.of(
                            "Continue standard weekly scouting on this block.",
                            "Maintain balanced plucking rounds and canopy ventilation.",
                            "Archive this specimen as a healthy reference if desired."));

    public DiseasePredictionService(SmartteaMlProperties mlProperties, PythonMember01Client mlClient) {
        this.mlProperties = mlProperties;
        this.mlClient = mlClient;
    }

    public Map<String, Object> predict(MultipartFile file) {
        validateUpload(file);
        if (mlProperties.isEnabled()) {
            try {
                return predictWithKeras(file);
            } catch (Exception ex) {
                log.error(
                        "Keras disease inference failed, using explicit RGB heuristic fallback: {}",
                        ex.getMessage(),
                        ex);
            }
        }
        return predictHeuristic(file, mlProperties.isEnabled());
    }

    private Map<String, Object> predictWithKeras(MultipartFile file) throws IOException {
        String suffix = suffixForFilename(file.getOriginalFilename());
        Path temp = Files.createTempFile("smarttea-disease-", suffix);
        try {
            file.transferTo(temp);
            Map<String, Object> ml = mlClient.predictDisease(temp);
            String classId = String.valueOf(ml.get("classId"));
            Map<String, Object> body = new LinkedHashMap<>(ml);
            body.put("summary", SUMMARIES.getOrDefault(classId, ""));
            body.put("nextSteps", NEXT_STEPS.getOrDefault(classId, List.of()));
            Map<String, String> pathology = PATHOLOGY.get(classId);
            if (pathology != null) {
                body.put("pathology", pathology);
            }
            body.put("demo", false);
            body.put("filename", file.getOriginalFilename());
            return body;
        } finally {
            Files.deleteIfExists(temp);
        }
    }

    private Map<String, Object> predictHeuristic(MultipartFile file, boolean mlWasEnabled) {
        BufferedImage decoded = readImage(file);
        BufferedImage rgb224 = resizeRgb(decoded, INPUT, INPUT);
        ImageFeatures features = ImageFeatures.from(rgb224);
        double[] logits = logitsFromFeatures(features, filenameHint(file.getOriginalFilename()));
        double[] probabilities = softmax(logits);
        int bestIndex = argMax(probabilities);
        String classId = CLASS_ORDER.get(bestIndex);
        double confidencePct = probabilities[bestIndex] * 100.0;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("classId", classId);
        body.put("predictedClass", classId);
        body.put("probability", probabilities[bestIndex]);
        body.put("confidence", probabilities[bestIndex]);
        body.put("summary", SUMMARIES.get(classId));
        body.put("nextSteps", NEXT_STEPS.get(classId));
        body.put("pathology", PATHOLOGY.get(classId));
        body.put("probabilities", buildProbabilityList(probabilities));
        body.put("demo", false);
        body.put("inferenceFallback", true);
        body.put(
                "fallbackReason",
                mlWasEnabled
                        ? "Trained Keras inference failed; this is a Java RGB heuristic estimate, not Model 01."
                        : "ML disabled; Java RGB heuristic estimate, not Model 01 Keras.");
        body.put("inferenceEngine", "java-rgb-heuristic-v1");
        body.put("targetModel", "EfficientNet-B0");
        body.put("inputSize", INPUT + " × " + INPUT + " RGB");
        body.put("filename", file.getOriginalFilename());
        body.put("features", features.toMap());
        return body;
    }

    private static void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required multipart field: file");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file must be an image.");
        }
    }

    private static String suffixForFilename(String filename) {
        if (filename == null) {
            return ".jpg";
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0) {
            return ".jpg";
        }
        String ext = filename.substring(dot).toLowerCase(Locale.ROOT);
        if (ext.length() > 8) {
            return ".jpg";
        }
        return ext;
    }

    private BufferedImage readImage(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not decode image. Use JPG or PNG.");
            }
            return image;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read uploaded image.");
        }
    }

    private static BufferedImage resizeRgb(BufferedImage source, int width, int height) {
        BufferedImage rgb = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.drawImage(source, 0, 0, null);
        g.dispose();
        BufferedImage scaled = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = scaled.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2.drawImage(rgb, 0, 0, width, height, null);
        g2.dispose();
        return scaled;
    }

    private static double[] logitsFromFeatures(ImageFeatures f, double[] filenameBoost) {
        double blister = 0.35 * f.greenDominance + 0.45 * f.textureStd + 0.25 * f.darkSpotRatio - 0.15 * f.redRustRatio;
        double grey = 0.40 * f.textureStd + 0.30 * f.lowChromaRatio + 0.20 * (1.0 - f.greenDominance);
        double redRust = 0.55 * f.redRustRatio + 0.25 * f.redDominance + 0.15 * f.midToneRatio;
        double healthy = 0.50 * f.greenDominance + 0.35 * (1.0 - f.textureStd) + 0.20 * (1.0 - f.darkSpotRatio);
        double[] logits = new double[] {blister, grey, redRust, healthy};
        for (int i = 0; i < logits.length; i++) {
            logits[i] += filenameBoost[i];
        }
        return logits;
    }

    /** Small boost when filename explicitly hints a class (does not override image content alone). */
    private static double[] filenameHint(String filename) {
        double[] boost = new double[4];
        if (filename == null) {
            return boost;
        }
        String name = filename.toLowerCase(Locale.ROOT);
        if (name.contains("grey")) {
            boost[1] = 0.35;
        }
        if (name.contains("rust") || name.contains("red")) {
            boost[2] = 0.35;
        }
        if (name.contains("healthy") || name.contains("ok")) {
            boost[3] = 0.35;
        }
        if (name.contains("blister")) {
            boost[0] = 0.35;
        }
        return boost;
    }

    private static double[] softmax(double[] logits) {
        double max = logits[0];
        for (double v : logits) {
            max = Math.max(max, v);
        }
        double sum = 0;
        double[] exp = new double[logits.length];
        for (int i = 0; i < logits.length; i++) {
            exp[i] = Math.exp(logits[i] - max);
            sum += exp[i];
        }
        double[] out = new double[logits.length];
        for (int i = 0; i < logits.length; i++) {
            out[i] = exp[i] / sum;
        }
        return out;
    }

    private static int argMax(double[] values) {
        int idx = 0;
        for (int i = 1; i < values.length; i++) {
            if (values[i] > values[idx]) {
                idx = i;
            }
        }
        return idx;
    }

    private List<Map<String, Object>> buildProbabilityList(double[] probabilities) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 0; i < CLASS_ORDER.size(); i++) {
            String id = CLASS_ORDER.get(i);
            double pct = probabilities[i] * 100.0;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", id);
            row.put("label", PATHOLOGY.get(id).get("label"));
            row.put("pct", Math.round(pct * 10.0) / 10.0);
            row.put("probability", probabilities[i]);
            list.add(row);
        }
        list.sort((a, b) -> Double.compare((Double) b.get("probability"), (Double) a.get("probability")));
        return list;
    }

    private record ImageFeatures(
            double greenDominance,
            double redDominance,
            double textureStd,
            double darkSpotRatio,
            double redRustRatio,
            double lowChromaRatio,
            double midToneRatio) {

        static ImageFeatures from(BufferedImage image) {
            int w = image.getWidth();
            int h = image.getHeight();
            int n = w * h;
            double sumR = 0;
            double sumG = 0;
            double sumB = 0;
            double[] lum = new double[n];
            int idx = 0;
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int rgb = image.getRGB(x, y);
                    double r = ((rgb >> 16) & 0xff) / 255.0;
                    double g = ((rgb >> 8) & 0xff) / 255.0;
                    double b = (rgb & 0xff) / 255.0;
                    sumR += r;
                    sumG += g;
                    sumB += b;
                    lum[idx++] = 0.299 * r + 0.587 * g + 0.114 * b;
                }
            }
            double meanR = sumR / n;
            double meanG = sumG / n;
            double meanB = sumB / n;
            double greenDominance = clamp(meanG - meanR, 0, 1);
            double redDominance = clamp(meanR - meanG, 0, 1);

            double meanLum = 0;
            for (double v : lum) {
                meanLum += v;
            }
            meanLum /= n;
            double var = 0;
            for (double v : lum) {
                double d = v - meanLum;
                var += d * d;
            }
            double textureStd = clamp(Math.sqrt(var / n) * 4.0, 0, 1);

            int darkSpots = 0;
            int redRust = 0;
            int lowChroma = 0;
            int midTone = 0;
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int rgb = image.getRGB(x, y);
                    double r = ((rgb >> 16) & 0xff) / 255.0;
                    double g = ((rgb >> 8) & 0xff) / 255.0;
                    double b = (rgb & 0xff) / 255.0;
                    double max = Math.max(r, Math.max(g, b));
                    double min = Math.min(r, Math.min(g, b));
                    double chroma = max - min;
                    if (g > 0.35 && r < g * 0.85 && b < g * 0.85 && chroma < 0.12) {
                        darkSpots++;
                    }
                    if (r > g * 1.15 && r > b * 1.05 && g < 0.55) {
                        redRust++;
                    }
                    if (chroma < 0.08 && max > 0.25 && max < 0.75) {
                        lowChroma++;
                    }
                    if (max > 0.35 && max < 0.7) {
                        midTone++;
                    }
                }
            }
            return new ImageFeatures(
                    greenDominance,
                    redDominance,
                    textureStd,
                    (double) darkSpots / n,
                    (double) redRust / n,
                    (double) lowChroma / n,
                    (double) midTone / n);
        }

        Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("greenDominance", round(greenDominance));
            map.put("redDominance", round(redDominance));
            map.put("textureStd", round(textureStd));
            map.put("darkSpotRatio", round(darkSpotRatio));
            map.put("redRustRatio", round(redRustRatio));
            return map;
        }

        private static double clamp(double v, double min, double max) {
            return Math.max(min, Math.min(max, v));
        }

        private static double round(double v) {
            return Math.round(v * 1000.0) / 1000.0;
        }
    }
}
