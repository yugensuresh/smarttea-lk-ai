#!/usr/bin/env python3
"""Unified SmartTea ML inference entrypoint (Member 01–03). JSON stdin → JSON stdout."""

from __future__ import annotations

import json
import os
import sys
import traceback

os.environ.setdefault("XGBOOST_VERBOSITY", "0")

import member01_inference as m1
import member02_03_inference as m23


def main() -> None:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            m1.emit_error("Empty stdin")
            return
        req = json.loads(raw)
        task = req.get("task")
        if task == "ping":
            out = {"ok": True}
            out.update(m23.ping_member02_03())
            out["diseaseModel"] = m1.disease_paths().is_file()
            out["riskModel"] = m1.risk_paths().is_file()
            out["member01Root"] = str(m1.member01_root())
            out["modelRoot"] = str(m23.model_root())
            m1.emit(out)
            return
        if task in ("disease", "risk"):
            if task == "disease":
                path = req.get("imagePath")
                if not path:
                    m1.emit_error("imagePath required")
                    return
                m1.emit(m1.predict_disease(path))
            else:
                m1.emit(m1.predict_risk(req.get("features") or {}))
            return
        m1.emit(m23.handle(task, req))
    except Exception as exc:  # noqa: BLE001
        m1.emit_error(str(exc), traceback.format_exc())


if __name__ == "__main__":
    main()
