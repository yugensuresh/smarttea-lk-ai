#!/usr/bin/env python3
"""Member 01 ML inference (Model 01 Keras, Model 02 joblib). JSON on stdin, JSON on stdout."""

from __future__ import annotations

import json
import math
import os
import sys
import traceback
from pathlib import Path
from typing import Any

# Lazy-loaded globals
_disease_model = None
_risk_model = None
_config: dict[str, Any] | None = None

ROOT = Path(__file__).resolve().parent
DEFAULT_MEMBER01 = (
    ROOT.parent / "src" / "main" / "java" / "com" / "smarttea" / "lk" / "model" / "Member01"
)


def member01_root() -> Path:
    return Path(os.environ.get("SMARTTEA_MEMBER01_ROOT", str(DEFAULT_MEMBER01)))


def load_config() -> dict[str, Any]:
    global _config
    if _config is None:
        with open(ROOT / "member01_config.json", encoding="utf-8") as f:
            _config = json.load(f)
    return _config


def emit(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()


def emit_error(message: str, detail: str | None = None) -> None:
    emit({"ok": False, "error": message, "detail": detail})


def disease_paths() -> Path:
    return member01_root() / "Diseasedetection" / "final_tea_disease_model.keras"


def risk_paths() -> Path:
    return member01_root() / "Riskprediction" / "Model02_Final_Model.joblib"


def build_disease_inference_model():
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
    import tensorflow as tf

    full = tf.keras.models.load_model(str(disease_paths()))
    inputs = tf.keras.Input(shape=(224, 224, 3), name="inference_input")
    x = full.get_layer("efficientnetb0")(inputs)
    x = full.get_layer("global_average_pooling2d")(x)
    x = full.get_layer("dropout")(x)
    outputs = full.get_layer("disease_predictions")(x)
    return tf.keras.Model(inputs=inputs, outputs=outputs)


def get_disease_model():
    global _disease_model
    if _disease_model is None:
        _disease_model = build_disease_inference_model()
    return _disease_model


def get_risk_model():
    global _risk_model
    if _risk_model is None:
        import joblib

        _risk_model = joblib.load(str(risk_paths()))
    return _risk_model


def predict_disease(image_path: str) -> dict[str, Any]:
    import numpy as np

    try:
        from tensorflow.keras.applications.efficientnet import preprocess_input
        from tensorflow.keras.utils import load_img, img_to_array
    except ImportError:
        from keras.applications.efficientnet import preprocess_input
        from keras.utils import load_img, img_to_array

    cfg = load_config()
    class_ids: list[str] = cfg["diseaseClassIds"]
    class_labels: list[str] = cfg["diseaseClassLabels"]

    model = get_disease_model()
    img = load_img(image_path, target_size=(224, 224))
    arr = img_to_array(img)
    batch = np.expand_dims(preprocess_input(arr), axis=0)
    probs = model.predict(batch, verbose=0)[0]
    best = int(probs.argmax())
    class_id = class_ids[best] if best < len(class_ids) else str(best)
    label = class_labels[best] if best < len(class_labels) else class_id

    probability_list = []
    for i, pid in enumerate(class_ids):
        if i >= len(probs):
            break
        plabel = class_labels[i] if i < len(class_labels) else pid
        pct = float(probs[i] * 100.0)
        probability_list.append(
            {"id": pid, "label": plabel, "pct": round(pct, 1), "probability": float(probs[i])}
        )
    probability_list.sort(key=lambda row: row["probability"], reverse=True)

    confidence = float(probs[best])
    softmax_vector = [float(probs[i]) for i in range(min(len(class_ids), len(probs)))]
    return {
        "ok": True,
        "classId": class_id,
        "predictedClass": class_id,
        "classIndex": best,
        "classIndexOrder": class_ids,
        "softmaxVector": softmax_vector,
        "probability": confidence,
        "confidence": confidence,
        "pathology": {
            "id": class_id,
            "label": label,
        },
        "probabilities": probability_list,
        "inferenceEngine": "keras-efficientnetb0-v1",
        "targetModel": "EfficientNet-B0",
        "inputSize": "224 × 224 RGB",
    }


RISK_FEATURE_ORDER = [
    "temperature_c",
    "relative_humidity_pct",
    "soil_moisture_pct",
    "leaf_wetness",
    "rainfall_mm",
    "light_intensity_lux",
    "wind_speed",
    "temperature_c_lag1",
    "temperature_c_lag3",
    "temperature_c_lag7",
    "relative_humidity_pct_lag7",
    "rainfall_mm_lag7",
    "soil_moisture_pct_lag3",
    "soil_moisture_pct_prev3d_mean",
    "relative_humidity_pct_prev7d_mean",
    "rainfall_mm_prev7d_mean",
    "month",
    "disease_class",
    "estate_id",
]


def predict_risk(features: dict[str, Any]) -> dict[str, Any]:
    import pandas as pd

    cfg = load_config()
    risk_labels: list[str] = cfg["riskClassLabels"]
    pdvi_labels: list[str] = cfg["pdviSeverityLabels"]

    row = {key: features.get(key) for key in RISK_FEATURE_ORDER}
    missing = [k for k in RISK_FEATURE_ORDER if row[k] is None or row[k] == ""]
    if missing:
        raise ValueError(f"Missing Model 02 features: {', '.join(missing)}")

    row["month"] = int(row["month"])
    frame = pd.DataFrame([row])
    pipeline = get_risk_model()
    pred = int(pipeline.predict(frame)[0])
    if hasattr(pipeline, "predict_proba"):
        proba = pipeline.predict_proba(frame)[0]
    else:
        proba = [0.0] * len(risk_labels)
        proba[pred] = 1.0

    category = risk_labels[pred] if pred < len(risk_labels) else str(pred)
    risk_score = int(round(min(100, max(0, (pred + float(proba[pred])) * 25))))

    # Map Model 02 risk bands to Model 03 PDVI severity slots (domain convention).
    # "Very High" environmental risk aligns to PDVI "Severe", not a separate fifth class.
    risk_to_pdvi_severity = {
        "Low": "Low",
        "Moderate": "Moderate",
        "High": "High",
        "Very High": "Severe",
    }
    severity_for_pdvi: dict[str, float] = {}
    for i, risk_label in enumerate(risk_labels):
        if i >= len(proba):
            break
        pdvi_label = risk_to_pdvi_severity.get(risk_label, risk_label)
        if pdvi_label in pdvi_labels:
            severity_for_pdvi[pdvi_label] = float(proba[i])
    total = sum(severity_for_pdvi.values())
    if total > 0:
        severity_for_pdvi = {k: v / total for k, v in severity_for_pdvi.items()}

    return {
        "ok": True,
        "predictedClass": pred,
        "riskCategory": category,
        "riskScore": risk_score,
        "riskScoreNote": "Model-derived index from predicted class probability; not validated ground-truth risk.",
        "probabilities": [
            {"label": risk_labels[i], "probability": float(proba[i])}
            for i in range(min(len(risk_labels), len(proba)))
        ],
        "severityProbabilitiesForPdvi": severity_for_pdvi,
        "pdviSeverityMapping": "Model02 Very High -> PDVI Severe; probabilities renormalized for PDVI formula.",
        "inferenceEngine": "sklearn-hgb-v1",
        "featuresUsed": row,
    }


def main() -> None:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            emit_error("Empty stdin")
            return
        req = json.loads(raw)
        task = req.get("task")
        if task == "disease":
            path = req.get("imagePath")
            if not path or not Path(path).is_file():
                emit_error("imagePath must point to an existing file")
                return
            emit(predict_disease(path))
        elif task == "risk":
            features = req.get("features") or {}
            emit(predict_risk(features))
        elif task == "ping":
            emit(
                {
                    "ok": True,
                    "diseaseModel": disease_paths().is_file(),
                    "riskModel": risk_paths().is_file(),
                    "member01Root": str(member01_root()),
                }
            )
        else:
            emit_error(f"Unknown task: {task}")
    except Exception as exc:  # noqa: BLE001
        emit_error(str(exc), traceback.format_exc())


if __name__ == "__main__":
    main()
