package com.smarttea.lk.service.member01;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PythonMember01ClientStdoutTest {

    @Test
    void extractJsonPayload_stripsXgbStylePrefixLine() {
        String polluted =
                "[21:43:31] WARNING: learner.cc:553: If you are loading a serialized model\n"
                        + "{\"ok\":true,\"inferenceEngine\":\"xgb-harvest-readiness-v1\"}";
        String json = PythonMember01Client.extractJsonPayload(polluted);
        assertEquals("{\"ok\":true,\"inferenceEngine\":\"xgb-harvest-readiness-v1\"}", json);
    }

    @Test
    void extractJsonPayload_passesThroughCleanJson() {
        String clean = "{\"ok\":true,\"maturityIndex\":18.5}";
        assertEquals(clean, PythonMember01Client.extractJsonPayload(clean));
    }
}
