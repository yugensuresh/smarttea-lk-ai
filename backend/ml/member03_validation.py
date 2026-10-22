"""Validate Member 03 model inputs before sklearn inference (no silent imputation on empty requests)."""

from __future__ import annotations

import math
from typing import Any

TEA_QUALITY_FEATURE_KEYS = (
    "temperature_c",
    "humidity_pct",
    "rainfall_mm",
    "soil_moisture_pct",
    "sunshine_hours",
    "elevation_m",
)

SUSTAINABILITY_FEATURE_KEYS = (
    "elevation_m",
    "soil_moisture_pct",
    "soil_ph",
    "rainfall_mm",
    "temperature_mean_c",
    "humidity_mean_pct",
    "et0_mm",
    "production_kg_per_day_monthly_average",
)


def _coerce_finite_number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        num = float(value)
    elif isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            num = float(stripped)
        except ValueError:
            return None
    else:
        return None
    if not math.isfinite(num):
        return None
    return num


def validate_required_features(features: dict[str, Any] | None, required_keys: tuple[str, ...], model_label: str) -> None:
    if not isinstance(features, dict) or not features:
        raise ValueError(f"{model_label}: features object is required")
    missing: list[str] = []
    invalid: list[str] = []
    for key in required_keys:
        if key not in features:
            missing.append(key)
            continue
        if _coerce_finite_number(features.get(key)) is None:
            invalid.append(key)
    if missing or invalid:
        parts: list[str] = []
        if missing:
            parts.append("missing: " + ", ".join(missing))
        if invalid:
            parts.append("invalid: " + ", ".join(invalid))
        raise ValueError(f"{model_label}: " + "; ".join(parts))


def normalized_feature_row(features: dict[str, Any], required_keys: tuple[str, ...]) -> dict[str, float]:
    validate_required_features(features, required_keys, "features")
    return {key: _coerce_finite_number(features[key]) for key in required_keys}  # type: ignore[misc]
