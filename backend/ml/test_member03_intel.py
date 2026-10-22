"""Member 03 STII engine, validation, and inference wiring tests."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODEL_ROOT = ROOT.parent / "src" / "main" / "java" / "com" / "smarttea" / "lk" / "model"
STII_PATH = MODEL_ROOT / "Member03" / "STII" / "stii_engine.py"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def load_stii_module():
    spec = importlib.util.spec_from_file_location("stii_engine_test", STII_PATH)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


class StiiEngineTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.stii = load_stii_module()

    def test_grade_quality_mappings(self) -> None:
        for grade, expected in (("A", 92.5), ("B", 77.5), ("C", 60.0), ("D", 42.5)):
            result = self.stii.calculate_stii(grade, 0)
            self.assertEqual(result["quality_score_equiv"], expected)

    def test_stii_formula_fifty_fifty(self) -> None:
        result = self.stii.calculate_stii("B", 70)
        self.assertEqual(result["stii_score"], round(0.5 * 77.5 + 0.5 * 70, 2))

    def test_tier_boundaries(self) -> None:
        self.assertEqual(self.stii.calculate_stii("A", 77.5)["performance_tier"], "Excellent")
        self.assertEqual(self.stii.calculate_stii("B", 92.5)["performance_tier"], "Excellent")
        self.assertEqual(self.stii.calculate_stii("B", 62.5)["performance_tier"], "Good")
        self.assertEqual(self.stii.calculate_stii("C", 54)["performance_tier"], "Moderate")
        self.assertEqual(self.stii.calculate_stii("D", 0)["performance_tier"], "Needs Improvement")

    def test_invalid_grade_rejected(self) -> None:
        with self.assertRaises(ValueError):
            self.stii.calculate_stii("Z", 50)


class Member03ValidationTest(unittest.TestCase):
    def test_missing_features_rejected(self) -> None:
        import member02_03_inference as m23

        with self.assertRaises(ValueError):
            m23.predict_tea_quality({})

    def test_nan_feature_rejected(self) -> None:
        import member02_03_inference as m23

        features = {
            "temperature_c": 24,
            "humidity_pct": 85,
            "rainfall_mm": 14,
            "soil_moisture_pct": 42,
            "sunshine_hours": float("nan"),
            "elevation_m": 1200,
        }
        with self.assertRaises(ValueError):
            m23.predict_tea_quality(features)


class Member03InferenceIntegrationTest(unittest.TestCase):
    def test_valid_quality_stii_chain(self) -> None:
        import member02_03_inference as m23

        tea = {
            "temperature_c": 24,
            "humidity_pct": 85,
            "rainfall_mm": 14,
            "soil_moisture_pct": 42,
            "sunshine_hours": 6.5,
            "elevation_m": 1200,
        }
        sustain = {
            "elevation_m": 1200,
            "soil_moisture_pct": 42,
            "soil_ph": 5.5,
            "rainfall_mm": 14,
            "temperature_mean_c": 24,
            "humidity_mean_pct": 85,
            "et0_mm": 4.2,
            "production_kg_per_day_monthly_average": 850,
        }
        quality = m23.predict_tea_quality(tea)
        self.assertEqual(quality["inferenceEngine"], "sklearn-gbc-tea-quality-v1")
        sustainability = m23.predict_sustainability(sustain)
        self.assertEqual(sustainability["inferenceEngine"], "sklearn-rf-sustainability-v1")
        stii = m23.predict_stii(
            {
                "teaGrade": quality["teaGrade"],
                "sustainabilityScore": sustainability["sustainabilityScore"],
            }
        )
        self.assertEqual(stii["inferenceEngine"], "stii-formula-v1")
        self.assertIn(stii["performance_tier"], ("Excellent", "Good", "Moderate", "Needs Improvement"))


if __name__ == "__main__":
    unittest.main()
