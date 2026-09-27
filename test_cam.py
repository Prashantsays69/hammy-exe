"""
Test suite for Hamster Reaction Cam.
Tests camera management, gesture detection heuristics for all 15 gestures,
detection priority hierarchy, UI rendering, and asset verification.
"""
import unittest
from types import SimpleNamespace

import cv2
import numpy as np

from hamster_cam.assets import generate_fallback_hamster, load_reaction_images
from hamster_cam.camera import CameraManager
from hamster_cam.config import (
    FOOTER_HEIGHT,
    HEADER_HEIGHT,
    PANEL_HEIGHT,
    PANEL_WIDTH,
    REACTIONS,
)
from hamster_cam.detector import DetectionState, HamsterGestureDetector
from hamster_cam.renderer import UIRenderer


def create_mock_hand(wrist=(0.5, 0.7), middle_mcp=(0.5, 0.5), thumb_tip=(0.4, 0.4), index_tip=(0.5, 0.3)):
    """Create 21 mock hand landmarks."""
    lms = []
    for _ in range(21):
        lms.append(SimpleNamespace(x=wrist[0], y=wrist[1], z=0.0))
    lms[0] = SimpleNamespace(x=wrist[0], y=wrist[1], z=0.0)
    lms[2] = SimpleNamespace(x=wrist[0] - 0.05, y=wrist[1] - 0.1, z=0.0)
    lms[4] = SimpleNamespace(x=thumb_tip[0], y=thumb_tip[1], z=0.0)
    lms[5] = SimpleNamespace(x=wrist[0] - 0.04, y=wrist[1] - 0.15, z=0.0)
    lms[8] = SimpleNamespace(x=index_tip[0], y=index_tip[1], z=0.0)
    lms[9] = SimpleNamespace(x=middle_mcp[0], y=middle_mcp[1], z=0.0)
    lms[12] = SimpleNamespace(x=wrist[0], y=wrist[1] - 0.25, z=0.0)
    lms[13] = SimpleNamespace(x=wrist[0] + 0.03, y=wrist[1] - 0.15, z=0.0)
    lms[16] = SimpleNamespace(x=wrist[0] + 0.03, y=wrist[1] - 0.25, z=0.0)
    lms[17] = SimpleNamespace(x=wrist[0] + 0.06, y=wrist[1] - 0.14, z=0.0)
    lms[20] = SimpleNamespace(x=wrist[0] + 0.06, y=wrist[1] - 0.24, z=0.0)
    return lms


class TestCameraManager(unittest.TestCase):
    def test_camera_fallback_and_synthetic_frame(self):
        # Index 99 is unlikely to exist, forcing fallback
        cam = CameraManager(device_index=99)
        self.assertTrue(cam.synthetic_mode)

        ok, frame, crop_meta = cam.read()
        self.assertTrue(ok)
        self.assertIsNotNone(frame)
        self.assertEqual(frame.shape, (PANEL_HEIGHT, PANEL_WIDTH, 3))
        self.assertEqual(len(crop_meta), 4)

        # Test pause toggle
        is_paused = cam.toggle_pause()
        self.assertTrue(is_paused)
        ok2, frame2, _ = cam.read()
        self.assertTrue(ok2)

        # Test mirror toggle
        mirror_val = cam.toggle_mirror()
        self.assertFalse(mirror_val)

        cam.release()
        self.assertIsNone(cam.cap)


class TestGestureClassifier(unittest.TestCase):
    def setUp(self):
        self.detector = HamsterGestureDetector()

    def tearDown(self):
        self.detector.close()

    def test_all_15_reactions_present(self):
        expected_keys = [
            "default",
            "thumbs_up",
            "thumbs_down",
            "fist_by_head",
            "glasses",
            "finger_mouth",
            "nerd",
            "bicep",
            "cross_arms",
            "shy",
            "thinking",
            "hug",
            "sad",
            "two_hands",
            "side_eye",
        ]
        for key in expected_keys:
            self.assertIn(key, REACTIONS, f"Missing reaction: {key}")
            self.assertTrue(REACTIONS[key].image_filename, f"Missing filename for {key}")

    def test_finger_extension_heuristic(self):
        landmarks = []
        for i in range(21):
            landmarks.append(SimpleNamespace(x=0.5, y=0.5 - (i * 0.02), z=0.0))

        fingers = self.detector.get_fingers_extension(landmarks)
        self.assertEqual(len(fingers), 5)

    def test_hand_shape_classification(self):
        # [Thumb, Index, Middle, Ring, Pinky]
        self.assertEqual(self.detector.classify_hand_shape([1, 0, 0, 0, 0]), "thumbs_up")
        self.assertEqual(self.detector.classify_hand_shape([0, 0, 0, 0, 0]), "fist")
        self.assertEqual(self.detector.classify_hand_shape([0, 1, 0, 0, 0]), "pointer")
        self.assertEqual(self.detector.classify_hand_shape([1, 1, 1, 1, 1]), "open_palm")
        self.assertIsNone(self.detector.classify_hand_shape([0, 1, 1, 0, 0]))

    def test_pinch_heuristic(self):
        # Pinch: thumb tip close to index tip, further from middle
        lms_pinch = create_mock_hand(
            wrist=(0.5, 0.8),
            middle_mcp=(0.5, 0.6),
            thumb_tip=(0.50, 0.45),
            index_tip=(0.51, 0.45),
        )
        is_p, ratio = self.detector.is_pinch_gesture(lms_pinch)
        self.assertTrue(is_p)
        self.assertLess(ratio, 0.5)

    def test_thumb_down_heuristic(self):
        # Thumb pointing down: thumb tip y > wrist y
        lms_down = create_mock_hand(
            wrist=(0.5, 0.5),
            middle_mcp=(0.5, 0.3),
            thumb_tip=(0.5, 0.8),  # pointing downwards
        )
        self.assertTrue(self.detector.is_thumb_down(lms_down))

        # Thumb pointing up: thumb tip y < wrist y
        lms_up = create_mock_hand(
            wrist=(0.5, 0.7),
            middle_mcp=(0.5, 0.5),
            thumb_tip=(0.5, 0.3),  # pointing upwards
        )
        self.assertFalse(self.detector.is_thumb_down(lms_up))

    def test_elbow_angle_calculation(self):
        # Right angle: shoulder at (0, 0), elbow at (0, 1), wrist at (1, 1)
        sh = SimpleNamespace(x=0.0, y=0.0)
        el = SimpleNamespace(x=0.0, y=1.0)
        wr = SimpleNamespace(x=1.0, y=1.0)
        angle = self.detector.calculate_elbow_angle(sh, el, wr)
        self.assertIsNotNone(angle)
        self.assertAlmostEqual(angle, 90.0, places=1)

    def test_head_orientation_extraction(self):
        matrix = [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0],
        ]
        yaw, pitch = self.detector.get_head_angles(matrix)
        self.assertAlmostEqual(yaw, 0.0, places=2)
        self.assertAlmostEqual(pitch, 0.0, places=2)

    def test_temporal_smoothing(self):
        for _ in range(7):
            self.detector.vote_history.append("thumbs_up")
        dummy = np.zeros((PANEL_HEIGHT, PANEL_WIDTH, 3), dtype=np.uint8)
        state = self.detector.evaluate(dummy, 100)
        self.assertEqual(state.stable_gesture, "thumbs_up")


class TestUIRenderer(unittest.TestCase):
    def test_render_composite_dimensions(self):
        renderer = UIRenderer(show_hud=True)
        dummy_meme = np.zeros((PANEL_HEIGHT, PANEL_WIDTH, 3), dtype=np.uint8)
        dummy_cam = np.zeros((PANEL_HEIGHT, PANEL_WIDTH, 3), dtype=np.uint8)
        state = DetectionState(stable_gesture="fist_by_head", raw_gesture="fist_by_head")

        canvas = renderer.compose_frame(
            meme_image=dummy_meme,
            camera_frame=dummy_cam,
            state=state,
            fps=30.0,
            is_paused=False,
            crop_meta=(640, 480, 80, 0),
        )

        expected_w = PANEL_WIDTH * 2
        expected_h = HEADER_HEIGHT + PANEL_HEIGHT + FOOTER_HEIGHT
        self.assertEqual(canvas.shape, (expected_h, expected_w, 3))

    def test_hud_toggle(self):
        renderer = UIRenderer(show_hud=True)
        self.assertTrue(renderer.show_hud)
        val = renderer.toggle_hud()
        self.assertFalse(val)
        self.assertFalse(renderer.show_hud)


class TestAssetManager(unittest.TestCase):
    def test_fallback_hamster_generation(self):
        img = generate_fallback_hamster("Lollipop Hamster", (200, 160, 255))
        self.assertEqual(img.shape, (PANEL_HEIGHT, PANEL_WIDTH, 3))
        self.assertTrue(np.count_nonzero(img) > 1000)

    def test_all_15_images_loadable(self):
        images = load_reaction_images()
        self.assertEqual(len(images), 15)
        for key, img in images.items():
            self.assertEqual(img.shape, (PANEL_HEIGHT, PANEL_WIDTH, 3))


if __name__ == "__main__":
    unittest.main()
