# SmartTea LK — Spring Boot API

Java **17** / Spring Boot **3.3** backend that implements the REST contract used by `frontend/src/api/*`.

## Member 01 ML artifacts

Trained files live under:

`src/main/java/com/smarttea/lk/model/Member01/`

| Model | Artifact | Runtime |
|-------|----------|---------|
| 01 Disease | `Diseasedetection/final_tea_disease_model.keras` | Python + TensorFlow |
| 02 Risk | `Riskprediction/Model02_Final_Model.joblib` | Python + scikit-learn **1.6.1** |
| 03 PDVI | `PDVI/Model03_PDVI_Final.ipynb` (formula) | Java `PdviCalculationService` |

**Member 02** (`Member02/`):

| Model | Artifact | Runtime |
|-------|----------|---------|
| 1 Readiness | `Harvestreadiness/model1_harvest_readiness_final.joblib` | Python XGBoost **1.7.6** (booster inference) |
| 2 Yield | `Yieldforecast/model2_yield_final.joblib` | Python XGBoost |
| 3 Climate | `Climate/model3_climate_risk_xgboost.joblib` | Python XGBoost |
| THRRI | `THRII/thrri_calculator_final.py` | Python formula |

**Member 03** (`Member03/`):

| Model | Artifact | Runtime |
|-------|----------|---------|
| 1 Tea quality | `Teaquality/Model01_Tea_Quality_Model.joblib` | Python sklearn |
| 2 Sustainability | `Sustainability/Model02_Sustainability_Model.joblib` | Python sklearn |
| STII | `STII/stii_engine.py` | Python formula |

### Python setup (required for Models 01 & 02)

From the `backend/` directory:

```powershell
cd D:\smarttea-lk-ai\backend
python -m pip install -r ml/requirements.txt
```

Set `smarttea.ml.enabled=false` in `application.properties` to use heuristic/catalog-only mode (CI/tests).

## Run locally

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
cd D:\smarttea-lk-ai\backend
mvn spring-boot:run
```

The server listens on **http://127.0.0.1:8000** (matches the Vite dev proxy in `frontend/vite.config.js`).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/dashboard?days=30` | Estate overview, fields, alerts, risk trend |
| GET | `/api/v1/alerts?estate=&q=` | Filtered alert feed |
| GET | `/api/v1/risk/environmental` | Model 02 service snapshot |
| POST | `/api/v1/predict/environmental-risk` | Model 02 inference (JSON `features`) |
| GET | `/api/v1/pdvi` | PDVI page payload (formula score from defaults) |
| POST | `/api/v1/predict/pdvi` | Model 03 PDVI from Model 01 + severity probabilities |
| GET | `/api/v1/models/disease` | Disease model metadata |
| GET | `/api/v1/models/risk` | Risk model metadata |
| GET | `/api/v1/models/member01/status` | ML ping / artifact paths |
| POST | `/api/v1/predict/disease` | Multipart `file` — Keras EfficientNet-B0 |
| POST | `/api/v1/predict/severity` | Severity heuristic (session handoff) |
| GET | `/api/v1/harvest/readiness` | Model 1 readiness scores per field |
| GET | `/api/v1/harvest/forecasting` | Model 2 yield forecast |
| GET | `/api/v1/harvest/climate-risk` | Model 3 climate risk |
| GET | `/api/v1/harvest/thrri` | THRRI composite |
| GET | `/api/v1/intel/sustainability-assessment` | Model 02 sustainability score |
| POST | `/api/v1/intel/predict/quality-stii` | Tea grade + STII bundle |
| GET | `/health` | Simple health check |

Errors use FastAPI-style JSON: `{ "detail": "message" }`.

## Frontend

With the backend running, start the UI from `frontend/` (`npm run dev`). Requests to `/api/*` are proxied to port **8000**.

## Notes

- Seed narrative data lives under `src/main/resources/data/`.
- Adjust Keras class order in `ml/member01_config.json` if training label order differs.

### Member 01 pipeline (UI)

1. **Disease Detection** — `POST /api/v1/predict/disease` (multipart). Artifact: `final_tea_disease_model.keras` (TensorFlow EfficientNet-B0, 224×224). Class order: `ml/member01_config.json`.
2. **Environmental Risk** — `POST /api/v1/predict/environmental-risk` with 19 features (see `member01_inference.py` `RISK_FEATURE_ORDER`). Returns `severityProbabilitiesForPdvi` for step 3.
3. **PDVI** — `POST /api/v1/predict/pdvi` with Model 01 disease + confidence (0–1) + severity probability map (Low/Moderate/High/Severe). Java formula in `PdviCalculationService`.
4. **Severity** — optional research heuristic only (`java-context-heuristic-v1`); not a trained lesion model.

Browser session handoff: `frontend/src/utils/leafWorkflow.js` (updated after Disease + Risk runs).

Verify ML: `GET /api/v1/ml/status`, `GET /api/v1/models/member01/status`, `python ml/smoke_test.py` (Member 02/03 tasks; Member 01 via disease upload in UI).
