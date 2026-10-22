package com.smarttea.lk.ml;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

/** Softmax index order must match training export (Drive class_names.json). */
class Member01ClassOrderTest {

    private static final Path CONFIG = Path.of("ml/member01_config.json");

    @Test
    void indexTwoIsRedRustIndexThreeIsHealthy() throws Exception {
        JsonNode root = new ObjectMapper().readTree(CONFIG.toFile());
        JsonNode ids = root.get("diseaseClassIds");
        assertEquals(4, ids.size());
        assertEquals("redRust", ids.get(2).asText());
        assertEquals("healthy", ids.get(3).asText());
    }
}
