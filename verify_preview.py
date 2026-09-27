"""
Generates and saves a real composite preview image of HamsterCamApp.
"""
import cv2
import numpy as np

from hamster_cam.app import HamsterCamApp
from hamster_cam.config import REACTIONS


def generate_preview():
    app = HamsterCamApp(camera_id=99, show_hud=True)

    # Read a test frame from camera (synthetic mode)
    ok, frame, crop_meta = app.camera.read()
    assert ok and frame is not None

    # Evaluate gesture state
    state = app.detector.evaluate(frame, 100)
    # Set to a recognizable reaction for the preview
    state.stable_gesture = "thumbs_up"
    state.raw_gesture = "thumbs_up"
    state.yaw_deg = 3.5
    state.pitch_deg = -1.2
    state.fingers_state = [1, 0, 0, 0, 0]
    state.hand_count = 1

    meme_img = app.reaction_images["thumbs_up"]

    ui = app.renderer.compose_frame(
        meme_image=meme_img,
        camera_frame=frame,
        state=state,
        fps=30.0,
        is_paused=False,
        crop_meta=crop_meta,
    )

    cv2.imwrite("preview.png", ui)
    print("Saved preview.png successfully with shape:", ui.shape)

    app.cleanup()


if __name__ == "__main__":
    generate_preview()
