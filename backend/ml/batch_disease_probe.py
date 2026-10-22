#!/usr/bin/env python3
"""One-off batch probe for Model 01 — run from backend/: python ml/batch_disease_probe.py <folder>"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import member01_inference as m1

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python ml/batch_disease_probe.py <image-folder>", file=sys.stderr)
        return 1
    folder = Path(sys.argv[1])
    if not folder.is_dir():
        print(f"Not a directory: {folder}", file=sys.stderr)
        return 1
    paths = sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXT)
    if not paths:
        print("No images found", file=sys.stderr)
        return 1
    rows = []
    for path in paths:
        out = m1.predict_disease(str(path))
        probs = {p["id"]: round(p["probability"], 6) for p in out["probabilities"]}
        rows.append(
            {
                "file": path.name,
                "classId": out["classId"],
                "confidence": round(float(out["confidence"]), 6),
                "probabilities": probs,
            }
        )
    print(json.dumps(rows, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
