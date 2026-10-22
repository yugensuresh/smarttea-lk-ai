package com.smarttea.lk.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.test.context.TestPropertySource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "smarttea.ml.enabled=false")
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void dashboardEndpointReturnsEstates() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard").param("days", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estates").isArray())
                .andExpect(jsonPath("$.estateStats.pdvi").value(72));
    }

    @Test
    void diseasePredictionAcceptsImageUpload() throws Exception {
        MockMultipartFile file = greenLeafPng("blister_leaf.jpg");
        mockMvc.perform(multipart("/api/v1/predict/disease").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classId").exists())
                .andExpect(jsonPath("$.inferenceEngine").value("java-rgb-heuristic-v1"))
                .andExpect(jsonPath("$.inferenceFallback").value(true))
                .andExpect(jsonPath("$.probabilities").isArray());
    }

    @Test
    void severityPredictionUsesModel01Context() throws Exception {
        String body =
                """
                {"model01Context":{"classId":"blister","confidence":82.5,"label":"Blister Blight"}}
                """;
        mockMvc.perform(
                        post("/api/v1/predict/severity")
                                .contentType("application/json")
                                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.severity").exists())
                .andExpect(jsonPath("$.affectedAreaPct").isNumber());
    }

    @Test
    void harvestReadinessEndpointReturnsFields() throws Exception {
        mockMvc.perform(get("/api/v1/harvest/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fields").isArray());
    }

    @Test
    void intelSustainabilityAssessmentUnavailableWhenMlDisabled() throws Exception {
        mockMvc.perform(get("/api/v1/intel/sustainability-assessment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.performanceScore.label").value("Unavailable"))
                .andExpect(jsonPath("$.sustainabilityFeatures").exists());
    }

    @Test
    void intelOverviewUnavailableWhenMlDisabled() throws Exception {
        mockMvc.perform(get("/api/v1/intel/overview")).andExpect(status().isServiceUnavailable());
    }

    @Test
    void qualityStiiRejectsMissingSustainabilityFeatures() throws Exception {
        String body =
                """
                {"teaQualityFeatures":{"temperature_c":24,"humidity_pct":85,"rainfall_mm":14,\
                "soil_moisture_pct":42,"sunshine_hours":6.5,"elevation_m":1200}}
                """;
        mockMvc.perform(
                        post("/api/v1/intel/predict/quality-stii")
                                .contentType("application/json")
                                .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void predictSustainabilityAcceptsFeaturesWrapperWhenMlDisabled() throws Exception {
        String body =
                """
                {"features":{"elevation_m":1200,"soil_moisture_pct":42,"soil_ph":5.5,"rainfall_mm":14,\
                "temperature_mean_c":24,"humidity_mean_pct":85,"et0_mm":4.2,\
                "production_kg_per_day_monthly_average":850}}
                """;
        mockMvc.perform(
                        post("/api/v1/intel/predict/sustainability")
                                .contentType("application/json")
                                .content(body))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void predictSustainabilityRejectsEmptyFeaturesWrapper() throws Exception {
        mockMvc.perform(
                        post("/api/v1/intel/predict/sustainability")
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Model 02 sustainability: features object is required"));
    }

    @Test
    void predictTeaQualityUnavailableWhenMlDisabled() throws Exception {
        String body =
                """
                {"features":{"temperature_c":24,"humidity_pct":85,"rainfall_mm":14,\
                "soil_moisture_pct":42,"sunshine_hours":6.5,"elevation_m":1200}}
                """;
        mockMvc.perform(
                        post("/api/v1/intel/predict/tea-quality")
                                .contentType("application/json")
                                .content(body))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void harvestForecastingReturnsLiveMetadata() throws Exception {
        mockMvc.perform(get("/api/v1/harvest/forecasting"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.predictedYield.value").exists())
                .andExpect(jsonPath("$.inferenceEngine").exists())
                .andExpect(jsonPath("$.environmentalDrivers").isArray());
    }

    @Test
    void harvestClimateRiskReturnsForecastDemoFlag() throws Exception {
        mockMvc.perform(get("/api/v1/harvest/climate-risk"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.riskAlert.level").exists())
                .andExpect(jsonPath("$.microClimateForecastDemo").value(true))
                .andExpect(jsonPath("$.inferenceEngine").exists());
    }

    @Test
    void harvestThrriReturnsScore() throws Exception {
        mockMvc.perform(get("/api/v1/harvest/thrri"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thrriScore").exists())
                .andExpect(jsonPath("$.inferenceEngine").exists());
    }

    @Test
    void mlStatusWhenDisabledReportsOkFalse() throws Exception {
        mockMvc.perform(get("/api/v1/ml/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mlEnabled").value(false))
                .andExpect(jsonPath("$.ok").value(false));
    }

    @Test
    void harvestReadinessIncludesInferenceEngine() throws Exception {
        mockMvc.perform(get("/api/v1/harvest/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inferenceEngine").exists());
    }

    @Test
    void member01StatusEndpointReturnsMeta() throws Exception {
        mockMvc.perform(get("/api/v1/models/member01/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mlEnabled").value(false));
    }

    @Test
    void environmentalRiskGetSnapshotIsCatalogOnly() throws Exception {
        mockMvc.perform(get("/api/v1/risk/environmental"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.inferenceEngine").value("catalog-seed"))
                .andExpect(jsonPath("$.meta.inferenceRan").value(false));
    }

    @Test
    void environmentalRiskPostReturnsServiceUnavailableWhenMlDisabled() throws Exception {
        String body =
                """
                {"features":{"temperature_c":24,"relative_humidity_pct":80,"soil_moisture_pct":40,
                "leaf_wetness":5,"rainfall_mm":10,"light_intensity_lux":40000,"wind_speed":2,
                "temperature_c_lag1":23,"temperature_c_lag3":22,"temperature_c_lag7":21,
                "relative_humidity_pct_lag7":75,"rainfall_mm_lag7":8,"soil_moisture_pct_lag3":39,
                "soil_moisture_pct_prev3d_mean":38,"relative_humidity_pct_prev7d_mean":74,
                "rainfall_mm_prev7d_mean":30,"month":10,"disease_class":"Blister_Blight","estate_id":"EST001"}}
                """;
        mockMvc.perform(
                        post("/api/v1/predict/environmental-risk")
                                .contentType("application/json")
                                .content(body))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void authLoginWithDemoUserReturnsToken() throws Exception {
        String body =
                """
                {"email":"demo@smarttea.lk","password":"demo1234","rememberMe":false}
                """;
        mockMvc.perform(post("/api/v1/auth/login").contentType("application/json").content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("demo@smarttea.lk"));
    }

    @Test
    void authRegisterAndMe() throws Exception {
        String register =
                """
                {"fullName":"Test User","email":"auth-test@smarttea.lk","password":"password123"}
                """;
        var result =
                mockMvc.perform(post("/api/v1/auth/register").contentType("application/json").content(register))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.accessToken").isNotEmpty())
                        .andReturn();
        String token =
                com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("auth-test@smarttea.lk"));
    }

    @Test
    void pdviPredictAcceptsSeverityProbabilities() throws Exception {
        String body =
                """
                {"model01Disease":"Blister_Blight","model01Confidence":0.82,
                "severityProbabilities":{"Low":0.1,"Moderate":0.3,"High":0.2,"Severe":0.4}}
                """;
        mockMvc.perform(
                        post("/api/v1/predict/pdvi")
                                .contentType("application/json")
                                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calculation.pdviScore").exists())
                .andExpect(jsonPath("$.meta.inferenceEngine").value("pdvi-formula-v1"));
    }

    private static MockMultipartFile greenLeafPng(String filename) throws Exception {
        BufferedImage image = new BufferedImage(48, 48, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(34, 120, 45));
        g.fillRect(0, 0, 48, 48);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return new MockMultipartFile("file", filename, "image/png", out.toByteArray());
    }
}
