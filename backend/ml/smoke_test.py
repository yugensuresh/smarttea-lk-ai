#!/usr/bin/env python3
"""Optional smoke test for Member 02/03 inference (run from backend/)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
SCRIPT = BACKEND / "ml" / "smarttea_inference.py"


def run_task(payload: dict) -> dict:
    proc = subprocess.run(
        [sys.executable, str(SCRIPT)],
        input=json.dumps(payload).encode("utf-8"),
        capture_output=True,
        cwd=str(BACKEND),
        timeout=120,
        check=False,
    )
    out = proc.stdout.decode("utf-8", errors="replace").strip()
    if proc.returncode != 0:
        raise RuntimeError(f"task={payload.get('task')} failed: {out or proc.stderr.decode()}")
    data = json.loads(out)
    if not data.get("ok"):
        raise RuntimeError(f"task={payload.get('task')} ok=false: {data.get('error')}")
    return data


def main() -> int:
    if not SCRIPT.is_file():
        print(f"Missing script: {SCRIPT}", file=sys.stderr)
        return 1

    ping = run_task({"task": "ping"})
    print("ping ok", {k: ping.get(k) for k in ping if k.startswith("member") or k in ("modelRoot", "ok")})

    readiness = run_task(
        {
            "task": "harvest-readiness",
            "features": {
                "rainfall_mm": 80,
                "humidity_percent": 75,
                "elevation_m": 900,
                "temperature_c": 23,
            },
        }
    )
    print("readiness maturityIndex", readiness.get("maturityIndex"))

    yield_pred = run_task(
        {
            "task": "harvest-yield",
            "features": {
                "temperature_max_c": 26,
                "temperature_min_c": 18,
                "temperature_avg_c": 24,
                "rainfall_mm": 14,
                "humidity_pct": 85,
                "wind_speed": 2.4,
                "soil_moisture_pct": 42,
                "estate_id": "EST001",
                "elevation_m": 1200,
                "block_id": "B01",
                "cultivated_area_ha": 12,
                "plucking_interval_days": 7,
            },
        }
    )
    print("yield kg", yield_pred.get("predictedYieldKg"))

    climate = run_task(
        {
            "task": "harvest-climate",
            "features": {
                "rainfall_mm": 45,
                "temperature_avg_c": 24,
                "soil_moisture_pct": 42,
                "wind_speed": 2.4,
            },
        }
    )
    print("climate risk", climate.get("riskLevel"))

    quality = run_task(
        {
            "task": "tea-quality",
            "features": {
                "temperature_c": 24,
                "humidity_pct": 85,
                "rainfall_mm": 14,
                "soil_moisture_pct": 42,
                "sunshine_hours": 6.5,
                "elevation_m": 1200,
            },
        }
    )
    print("tea grade", quality.get("teaGrade"))

    sustain = run_task(
        {
            "task": "sustainability",
            "features": {
                "elevation_m": 1200,
                "soil_moisture_pct": 42,
                "soil_ph": 5.5,
                "rainfall_mm": 14,
                "temperature_mean_c": 24,
                "humidity_mean_pct": 85,
                "et0_mm": 4.2,
                "production_kg_per_day_monthly_average": 850,
            },
        }
    )
    print("sustainability score", sustain.get("sustainabilityScore"))

    print("smoke_test: all passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
