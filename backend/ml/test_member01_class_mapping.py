"""Model 01 softmax index → classId mapping (matches training export class_names.json)."""

from __future__ import annotations

import json
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np

ROOT = Path(__file__).resolve().parent


class Member01ClassMappingTest(unittest.TestCase):
    def test_config_index_two_is_red_rust_index_three_is_healthy(self) -> None:
        cfg = json.loads((ROOT / "member01_config.json").read_text(encoding="utf-8"))
        ids = cfg["diseaseClassIds"]
        self.assertEqual(len(ids), 4)
        self.assertEqual(ids[2], "redRust")
        self.assertEqual(ids[3], "healthy")

    def test_class_names_json_aligns_with_config_ids(self) -> None:
        names = json.loads((ROOT / "class_names.json").read_text(encoding="utf-8"))
        cfg = json.loads((ROOT / "member01_config.json").read_text(encoding="utf-8"))
        self.assertEqual(len(names), 4)
        # Training export names ↔ API ids (same index order)
        expected_pairs = [
            ("Blister_Blight", "blister"),
            ("Grey_Blight", "grey"),
            ("Red_Rust", "redRust"),
            ("Healthy", "healthy"),
        ]
        for i, (train_name, api_id) in enumerate(expected_pairs):
            self.assertEqual(names[i], train_name)
            self.assertEqual(cfg["diseaseClassIds"][i], api_id)

    @patch("member01_inference.get_disease_model")
    @patch("tensorflow.keras.utils.img_to_array")
    @patch("tensorflow.keras.utils.load_img")
    def test_argmax_index_three_returns_healthy(
        self, load_img: MagicMock, img_to_array: MagicMock, get_model: MagicMock
    ) -> None:
        import member01_inference as m1

        vec = np.array([0.00432, 0.00024, 0.00023, 0.99521], dtype=np.float32)
        model = MagicMock()
        model.predict.return_value = np.expand_dims(vec, 0)
        get_model.return_value = model
        load_img.return_value = MagicMock()
        img_to_array.return_value = np.zeros((224, 224, 3), dtype=np.float32)

        out = m1.predict_disease("dummy.jpg")
        self.assertEqual(out["classIndex"], 3)
        self.assertEqual(out["classId"], "healthy")
        self.assertAlmostEqual(out["confidence"], 0.99521, places=5)
        by_id = {p["id"]: p["probability"] for p in out["probabilities"]}
        self.assertAlmostEqual(by_id["healthy"], 0.99521, places=5)
        self.assertAlmostEqual(by_id["redRust"], 0.00023, places=5)
        self.assertAlmostEqual(by_id["blister"], 0.00432, places=5)

    @patch("member01_inference.get_disease_model")
    @patch("tensorflow.keras.utils.img_to_array")
    @patch("tensorflow.keras.utils.load_img")
    def test_argmax_index_two_returns_red_rust(
        self, load_img: MagicMock, img_to_array: MagicMock, get_model: MagicMock
    ) -> None:
        import member01_inference as m1

        vec = np.array([0.01, 0.02, 0.95, 0.02], dtype=np.float32)
        model = MagicMock()
        model.predict.return_value = np.expand_dims(vec, 0)
        get_model.return_value = model
        load_img.return_value = MagicMock()
        img_to_array.return_value = np.zeros((224, 224, 3), dtype=np.float32)

        out = m1.predict_disease("dummy.jpg")
        self.assertEqual(out["classIndex"], 2)
        self.assertEqual(out["classId"], "redRust")
        self.assertNotEqual(out["classId"], "healthy")


if __name__ == "__main__":
    unittest.main()
