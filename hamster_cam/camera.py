import logging
import math
import time
from typing import Optional, Tuple

import cv2
import numpy as np

from hamster_cam.config import (
    COLOR_APP_BG,
    COLOR_TEXT_MUTED,
    COLOR_TEXT_PRIMARY,
    PANEL_HEIGHT,
    PANEL_WIDTH,
)

logger = logging.getLogger(__name__)


class CameraManager:
    """
    Manages webcam acquisition, square cropping, mirror toggling,
    start/pause controls, and synthetic fallback test frames.
    """

    def __init__(self, device_index: int = 0, mirror: bool = True):
        self.device_index = device_index
        self.mirror = mirror
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_paused = False
        self.synthetic_mode = False
        self._last_frame: Optional[np.ndarray] = None
        self._frame_count = 0
        self._fps_last_time = time.time()
        self._fps_counter = 0
        self.current_fps = 0.0

        self.open()

    def open(self) -> bool:
        """Open or reconnect the camera hardware."""
        self.release()
        logger.info("Attempting to open camera device %d...", self.device_index)

        # On Windows, cv2.CAP_DSHOW can open faster without delay
        cap = cv2.VideoCapture(self.device_index, cv2.CAP_DSHOW)
        if not cap.isOpened():
            # Fall back to default backend
            cap = cv2.VideoCapture(self.device_index)

        if cap.isOpened():
            self.cap = cap
            # Request 720p or standard streaming
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            self.synthetic_mode = False
            logger.info("Camera %d opened successfully.", self.device_index)
            return True
        else:
            logger.warning(
                "Camera %d unavailable. Switching to synthetic interactive fallback mode.",
                self.device_index,
            )
            self.synthetic_mode = True
            return False

    def toggle_pause(self) -> bool:
        """Toggle camera paused state."""
        self.is_paused = not self.is_paused
        return self.is_paused

    def toggle_mirror(self) -> bool:
        """Toggle horizontal mirror flip."""
        self.mirror = not self.mirror
        return self.mirror

    def cycle_device(self, max_devices: int = 4) -> int:
        """Switch to next camera index."""
        next_idx = (self.device_index + 1) % max_devices
        self.device_index = next_idx
        self.open()
        return self.device_index

    def read(self) -> Tuple[bool, np.ndarray, Tuple[int, int, int, int]]:
        """
        Read a frame from camera, apply mirror/pause, and crop to square.
        Returns:
            success (bool),
            square_frame (np.ndarray of shape [PANEL_HEIGHT, PANEL_WIDTH, 3]),
            crop_meta (orig_w, orig_h, crop_x0, crop_y0)
        """
        now = time.time()
        self._fps_counter += 1
        if now - self._fps_last_time >= 1.0:
            self.current_fps = self._fps_counter / (now - self._fps_last_time)
            self._fps_counter = 0
            self._fps_last_time = now

        self._frame_count += 1

        if self.is_paused and self._last_frame is not None:
            # Return cached frame while paused with slight overlay tint
            return True, self._last_frame.copy(), (PANEL_WIDTH, PANEL_HEIGHT, 0, 0)

        raw_frame = None
        if self.cap is not None and self.cap.isOpened() and not self.synthetic_mode:
            ok, frame = self.cap.read()
            if ok and frame is not None:
                raw_frame = frame
            else:
                logger.warning("Camera read failed. Falling back to synthetic pattern.")
                self.synthetic_mode = True

        if raw_frame is None:
            raw_frame = self._generate_synthetic_frame()

        if self.mirror and not self.synthetic_mode:
            raw_frame = cv2.flip(raw_frame, 1)

        # Crop to square
        orig_h, orig_w = raw_frame.shape[:2]
        side = min(orig_h, orig_w)
        crop_x0 = (orig_w - side) // 2
        crop_y0 = (orig_h - side) // 2

        square = raw_frame[crop_y0 : crop_y0 + side, crop_x0 : crop_x0 + side]
        if square.shape[0] != PANEL_HEIGHT or square.shape[1] != PANEL_WIDTH:
            square = cv2.resize(square, (PANEL_WIDTH, PANEL_HEIGHT), interpolation=cv2.INTER_LINEAR)

        self._last_frame = square
        return True, square, (orig_w, orig_h, crop_x0, crop_y0)

    def _generate_synthetic_frame(self) -> np.ndarray:
        """Create an attractive test card when no hardware camera is present."""
        w, h = 640, 480
        frame = np.full((h, w, 3), COLOR_APP_BG, dtype=np.uint8)

        # Subtly shifting background grid
        t = self._frame_count * 0.05
        grid_step = 40
        for x in range(0, w, grid_step):
            cv2.line(frame, (x, 0), (x, h), (35, 28, 38), 1)
        for y in range(0, h, grid_step):
            cv2.line(frame, (0, y), (w, y), (35, 28, 38), 1)

        # Floating test orb
        orb_x = int(w / 2 + math.sin(t) * 120)
        orb_y = int(h / 2 + math.cos(t * 0.8) * 70)
        cv2.circle(frame, (orb_x, orb_y), 36, (220, 160, 90), -1, cv2.LINE_AA)
        cv2.circle(frame, (orb_x, orb_y), 42, (255, 200, 140), 2, cv2.LINE_AA)

        # Status text
        banner_y = h // 2 - 40
        cv2.putText(
            frame,
            "TEST PATTERN / NO CAMERA FOUND",
            (w // 2 - 190, banner_y),
            cv2.FONT_HERSHEY_DUPLEX,
            0.6,
            COLOR_TEXT_PRIMARY,
            1,
            cv2.LINE_AA,
        )
        cv2.putText(
            frame,
            "Connect webcam and press 'R' to reconnect",
            (w // 2 - 180, banner_y + 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            COLOR_TEXT_MUTED,
            1,
            cv2.LINE_AA,
        )

        return frame

    def release(self) -> None:
        """Release camera resource."""
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception as exc:
                logger.debug("Exception releasing cap: %s", exc)
            self.cap = None
