"""Member 02 (harvest/climate/yield) and Member 03 (quality/sustainability/STII) inference."""

from __future__ import annotations

import importlib.util
import math
import os
from pathlib import Path
from typing import Any

# XGBoost on Windows may log "[timestamp] WARNING:..." to stdout and break Java JSON parsing.
os.environ.setdefault("XGBOOST_VERBOSITY", "0")

import joblib
import math
import numpy as np
import pandas as pd
import xgboost as xgb

from member03_validation import (
    SUSTAINABILITY_FEATURE_KEYS,
    TEA_QUALITY_FEATURE_KEYS,
    normalized_feature_row,
    validate_required_features,
)

try:
    xgb.set_config(verbosity=0)
except (AttributeError, TypeError, ValueError):
    pass

ROOT = Path(__file__).resolve().parent


def model_root() -> Path:
    import os

    return Path(
        os.environ.get(
            "SMARTTEA_MODEL_ROOT",
            str(ROOT.parent / "src" / "main" / "java" / "com" / "smarttea" / "lk" / "model"),
        )
    )


_models: dict[str, Any] = {}


def _load(path: Path, key: str):
    if key not in _models:
        _models[key] = joblib.load(path)
    return _models[key]


def _path(*parts: str) -> Path:
    return model_root().joinpath(*parts)


def _xgb_booster_predict(estimator, X: pd.DataFrame) -> np.ndarray:
    if hasattr(estimator, "steps"):
        Xt: Any = X
        for _, step in estimator.steps[:-1]:
            Xt = step.transform(Xt)
        booster = estimator.steps[-1][1].get_booster()
        matrix = np.asarray(Xt)
        dmat = xgb.DMatrix(matrix)
    else:
        booster = estimator.get_booster()
        dmat = xgb.DMatrix(X.values, feature_names=list(X.columns))
    return np.asarray(booster.predict(dmat))


def _load_thrri():
    path = _path("Member02", "THRII", "thrri_calculator_final.py")
    spec = importlib.util.spec_from_file_location("thrri_calc", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod.calculate_thrri


def _load_stii():
    path = _path("Member03", "STII", "stii_engine.py")
    spec = importlib.util.spec_from_file_location("stii_engine", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod.calculate_stii


def predict_harvest_readiness(features: dict[str, Any]) -> dict[str, Any]:
    model = _load(
        _path("Member02", "Harvestreadiness", "model1_harvest_readiness_final.joblib"),
        "m2_readiness",
    )
    order = list(model.feature_names_in_)
    row = pd.DataFrame([{k: features.get(k) for k in order}])
    raw = _xgb_booster_predict(model, row)
    prob_ready = float(np.asarray(raw).reshape(-1)[0])
    prob_ready = min(1.0, max(0.0, prob_ready))
    ready = prob_ready >= 0.25
    maturity = round(prob_ready * 100, 1)
    return {
        "ok": True,
        "readinessProbability": prob_ready,
        "ready": ready,
        "maturityIndex": maturity,
        "readinessLabel": "Ready" if ready else "Not Ready",
        "inferenceEngine": "xgb-harvest-readiness-v1",
        "featuresUsed": features,
    }


def predict_harvest_yield(features: dict[str, Any]) -> dict[str, Any]:
    model = _load(
        _path("Member02", "Yieldforecast", "model2_yield_final.joblib"),
        "m2_yield",
    )
    order = list(model.feature_names_in_)
    row = pd.DataFrame([{k: features.get(k) for k in order}])
    raw = _xgb_booster_predict(model, row)
    kg = float(raw[0]) if raw.ndim else float(raw)
    return {
        "ok": True,
        "predictedYieldKg": round(kg, 2),
        "inferenceEngine": "xgb-yield-v1",
        "featuresUsed": features,
    }


def predict_climate_risk(features: dict[str, Any]) -> dict[str, Any]:
    model = _load(
        _path("Member02", "Climate", "model3_climate_risk_xgboost.joblib"),
        "m2_climate",
    )
    order = list(model.feature_names_in_)
    row = pd.DataFrame([{k: features.get(k) for k in order}])
    raw = _xgb_booster_predict(model, row)
    probs = np.asarray(raw, dtype=float).reshape(-1)
    if probs.size == 1:
        probs = np.array([1 - probs[0], probs[0]])
    probs = probs / probs.sum() if probs.sum() > 0 else probs
    labels = ["Low", "Moderate", "High"][: probs.size]
    best = int(np.argmax(probs))
    high_risk = float(probs[-1]) if probs.size >= 3 else float(max(probs[1:]))
    return {
        "ok": True,
        "riskLevel": labels[best].upper(),
        "riskClass": best,
        "confidence": round(float(probs[best]) * 100, 1),
        "highRiskProbability": high_risk,
        "probabilities": [
            {"label": labels[i], "probability": float(probs[i])} for i in range(len(labels))
        ],
        "inferenceEngine": "xgb-climate-risk-v1",
        "featuresUsed": features,
    }


def predict_thrri(body: dict[str, Any]) -> dict[str, Any]:
    calc = _load_thrri()
    readiness = float(body.get("readinessProbability", body.get("readiness_probability", 0.5)))
    high_risk = float(body.get("highRiskProbability", body.get("high_risk_probability", 0.2)))
    result = calc(readiness, high_risk)
    result["ok"] = True
    result["inferenceEngine"] = "thrri-formula-v1"
    return result


def predict_tea_quality(features: dict[str, Any]) -> dict[str, Any]:
    validate_required_features(features, TEA_QUALITY_FEATURE_KEYS, "Model 01 tea quality")
    model = _load(
        _path("Member03", "Teaquality", "Model01_Tea_Quality_Model.joblib"),
        "m3_quality",
    )
    order = list(model.feature_names_in_)
    values = normalized_feature_row(features, tuple(order))
    row = pd.DataFrame([values])
    grade = str(model.predict(row)[0])
    proba = model.predict_proba(row)[0]
    classes = list(model.classes_)
    return {
        "ok": True,
        "teaGrade": grade,
        "probabilities": [
            {"grade": classes[i], "probability": float(proba[i])} for i in range(len(classes))
        ],
        "inferenceEngine": "sklearn-gbc-tea-quality-v1",
        "featuresUsed": features,
    }


def predict_sustainability(features: dict[str, Any]) -> dict[str, Any]:
    validate_required_features(features, SUSTAINABILITY_FEATURE_KEYS, "Model 02 sustainability")
    model = _load(
        _path("Member03", "Sustainability", "Model02_Sustainability_Model.joblib"),
        "m3_sustain",
    )
    order = list(model.feature_names_in_)
    values = normalized_feature_row(features, tuple(order))
    row = pd.DataFrame([values])
    score = float(model.predict(row)[0])
    score = min(100.0, max(0.0, score))
    label = (
        "Excellent"
        if score >= 85
        else "Good"
        if score >= 70
        else "Moderate"
        if score >= 55
        else "Needs Improvement"
    )
    return {
        "ok": True,
        "sustainabilityScore": round(score, 2),
        "performanceLabel": label,
        "inferenceEngine": "sklearn-rf-sustainability-v1",
        "featuresUsed": features,
    }


def predict_stii(body: dict[str, Any]) -> dict[str, Any]:
    calc = _load_stii()
    grade = body.get("teaGrade", body.get("tea_grade"))
    if grade is None or str(grade).strip() == "":
        raise ValueError("STII: teaGrade is required")
    raw_sustain = body.get("sustainabilityScore", body.get("sustainability_score"))
    if raw_sustain is None:
        raise ValueError("STII: sustainabilityScore is required")
    sustain = float(raw_sustain)
    if not math.isfinite(sustain):
        raise ValueError("STII: sustainabilityScore must be a finite number")
    result = calc(grade, sustain)
    result["ok"] = True
    result["inferenceEngine"] = "stii-formula-v1"
    return result


def ping_member02_03() -> dict[str, Any]:
    root = model_root()
    return {
        "member02Readiness": (
            root / "Member02/Harvestreadiness/model1_harvest_readiness_final.joblib"
        ).is_file(),
        "member02Yield": (root / "Member02/Yieldforecast/model2_yield_final.joblib").is_file(),
        "member02Climate": (root / "Member02/Climate/model3_climate_risk_xgboost.joblib").is_file(),
        "member03Quality": (root / "Member03/Teaquality/Model01_Tea_Quality_Model.joblib").is_file(),
        "member03Sustainability": (
            root / "Member03/Sustainability/Model02_Sustainability_Model.joblib"
        ).is_file(),
    }


def handle(task: str, req: dict[str, Any]) -> dict[str, Any]:
    features = req.get("features") or {}
    if task == "harvest-readiness":
        return predict_harvest_readiness(features)
    if task == "harvest-yield":
        return predict_harvest_yield(features)
    if task == "harvest-climate":
        return predict_climate_risk(features)
    if task == "harvest-thrri":
        return predict_thrri(req)
    if task == "tea-quality":
        return predict_tea_quality(features)
    if task == "sustainability":
        return predict_sustainability(features)
    if task == "stii":
        return predict_stii(req)
    raise ValueError(f"Unknown Member 02/03 task: {task}")
