import logging
import sys
import time
from typing import Optional

import cv2

from hamster_cam.assets import ensure_models, load_reaction_images
from hamster_cam.camera import CameraManager
from hamster_cam.config import REACTIONS, WINDOW_TITLE
from hamster_cam.detector import HamsterGestureDetector
from hamster_cam.renderer import UIRenderer

logger = logging.getLogger(__name__)


class HamsterCamApp:
    """
    Main application controller managing lifecycle, camera acquisition,
    reaction detection, user input, and display rendering.
    """

    def __init__(self, camera_id: int = 0, show_hud: bool = True):
        self.camera_id = camera_id
        self.show_hud = show_hud
        self.running = False

        # Prepare components
        logger.info("Verifying required assets and models...")
        ensure_models()
        self.reaction_images = load_reaction_images()

        self.camera = CameraManager(device_index=self.camera_id)
        self.detector = HamsterGestureDetector()
        self.renderer = UIRenderer(show_hud=self.show_hud)

    def run(self) -> None:
        """Start the interactive webcam loop."""
        self.running = True
        frame_idx = 0

        cv2.namedWindow(WINDOW_TITLE, cv2.WINDOW_AUTOSIZE)
        logger.info("Hamster Reaction Cam started. Press 'q' or 'Esc' to exit.")

        try:
            while self.running:
                ok, camera_frame, crop_meta = self.camera.read()
                if not ok or camera_frame is None:
                    time.sleep(0.01)
                    continue

                timestamp_ms = int(frame_idx * 33.33)
                frame_idx += 1

                # Detect gestures
                state = self.detector.evaluate(camera_frame, timestamp_ms)

                # Select active hamster reaction image
                current_meme = self.reaction_images.get(
                    state.stable_gesture,
                    self.reaction_images["default"],
                )

                # Compose polished interface
                ui_canvas = self.renderer.compose_frame(
                    meme_image=current_meme,
                    camera_frame=camera_frame,
                    state=state,
                    fps=self.camera.current_fps,
                    is_paused=self.camera.is_paused,
                    crop_meta=crop_meta,
                )

                cv2.imshow(WINDOW_TITLE, ui_canvas)

                # Handle hotkeys
                key = cv2.waitKey(1) & 0xFF
                if key in (ord("q"), 27):  # 'q' or Esc
                    logger.info("Quit key pressed.")
                    break
                elif key == ord("d"):  # Toggle HUD
                    self.renderer.toggle_hud()
                elif key == ord("s"):  # Pause/Resume camera
                    self.camera.toggle_pause()
                elif key == ord("m"):  # Toggle mirror
                    self.camera.toggle_mirror()
                elif key == ord("r"):  # Reconnect / switch camera
                    self.camera.cycle_device()

                # Detect window close button (X)
                if cv2.getWindowProperty(WINDOW_TITLE, cv2.WND_PROP_VISIBLE) < 1:
                    logger.info("Window closed by user.")
                    break

        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received.")
        finally:
            self.cleanup()

    def cleanup(self) -> None:
        """Gracefully release camera and Vision models."""
        self.running = False
        logger.info("Cleaning up resources...")
        self.camera.release()
        self.detector.close()
        cv2.destroyAllWindows()
        logger.info("Cleanup complete. Goodbye!")
