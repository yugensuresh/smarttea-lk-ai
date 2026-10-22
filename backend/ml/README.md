# SmartTea ML inference

Member 01–03 models are invoked from Spring Boot via `smarttea_inference.py` (JSON on stdin → JSON on stdout).

## Setup

From the **`backend/`** directory (required for relative model paths in `application.properties`):

```bash
pip install -r ml/requirements.txt
```

Important pins:

- **XGBoost 1.7.6** — Member 02 readiness/yield/climate joblibs were saved with an older XGBoost; newer versions often fail load or predict.
- **scikit-learn 1.6.1** — matches training pipelines for joblib artifacts.
- **TensorFlow** — only needed for Member 01 Keras disease model.

## Configuration

In `application.properties`:

- `smarttea.ml.enabled=true`
- `smarttea.ml.python-executable=python`
- `smarttea.ml.inference-script=ml/smarttea_inference.py`
- `smarttea.ml.model-root=src/main/java/com/smarttea/lk/model`

Optional environment overrides for the Python subprocess:

- `SMARTTEA_MODEL_ROOT` — root containing `Member01`, `Member02`, `Member03`
- `SMARTTEA_MEMBER01_ROOT` — Member 01 subtree

## Health check

With the backend running:

```http
GET /api/v1/ml/status
```

When ML is enabled and Python is healthy, expect `ok: true` and artifact flags (`member02Readiness`, etc.).

## Smoke test (optional)

From `backend/`:

```bash
python ml/smoke_test.py
```

Runs `ping` and one lightweight task per Member 02/03 model. Exits non-zero on failure.

## Tasks

| Task | Member | Notes |
|------|--------|--------|
| `harvest-readiness` | 02 | 4 features; maturity index ≈ P(ready)×100 |
| `harvest-yield` | 02 | 12 features + categoricals |
| `harvest-climate` | 02 | 3-class risk |
| `harvest-thrri` | 02 | Formula from readiness + high-risk probs |
| `tea-quality` | 03 | Grade A–D |
| `sustainability` | 03 | Score 0–100 |
| `stii` | 03 | Combines grade + sustainability |

Manual ping:

```bash
echo {"task":"ping"} | python ml/smarttea_inference.py
```

Run from `backend/` so the script resolves `ml/` and model paths correctly.

### Member 01 (disease + risk)

- Disease: upload via UI or `task: disease` with `imagePath` in `member01_inference.py`.
- Risk: `task: risk` with all keys in `RISK_FEATURE_ORDER` (see `member01_inference.py`).
- Class label order for Keras softmax: `ml/member01_config.json` (must match `ml/class_names.json` / training export).
- Supported disease artifact: **`final_tea_disease_model.keras`** (not PyTorch `.pth` unless converted and inference updated).
- Batch diagnostic (same preprocessing as production): `python ml/batch_disease_probe.py <folder-with-images>` from `backend/`.
