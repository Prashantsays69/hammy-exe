import logging
import os
import urllib.request
from pathlib import Path
from typing import Dict, Optional

import cv2
import numpy as np

from hamster_cam.config import (
    FACE_MODEL_FILE,
    HAND_MODEL_FILE,
    IMAGES_DIR,
    MODELS_DIR,
    MODEL_URLS,
    PANEL_HEIGHT,
    PANEL_WIDTH,
    POSE_MODEL_FILE,
    REACTIONS,
    REFERENCE_IMAGES_BASE_URL,
)

logger = logging.getLogger(__name__)


def ensure_directories() -> None:
    """Ensure asset and model directories exist."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)


def download_file(url: str, destination: Path, desc: str = "") -> bool:
    """Download a file with user-friendly logging."""
    if destination.exists() and destination.stat().st_size > 0:
        return True

    destination.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Downloading %s to %s...", desc or destination.name, destination)
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "HamsterReactionCam/1.0"},
        )
        with urllib.request.urlopen(req, timeout=30) as response, open(
            destination, "wb"
        ) as out_file:
            data = response.read()
            out_file.write(data)
        logger.info("Successfully downloaded %s (%d bytes).", destination.name, len(data))
        return True
    except Exception as exc:
        logger.warning("Failed to download %s: %s", url, exc)
        if destination.exists():
            destination.unlink(missing_ok=True)
        return False


def ensure_models() -> bool:
    """Ensure all required MediaPipe task models are downloaded."""
    ensure_directories()
    all_ready = True

    model_mapping = [
        (HAND_MODEL_FILE, MODEL_URLS["hand"], "Hand Landmarker model"),
        (FACE_MODEL_FILE, MODEL_URLS["face"], "Face Landmarker model"),
        (POSE_MODEL_FILE, MODEL_URLS["pose"], "Pose Landmarker model"),
    ]

    for model_path, url, name in model_mapping:
        if not model_path.exists():
            success = download_file(url, model_path, desc=name)
            if not success:
                all_ready = False

    return all_ready


def generate_fallback_hamster(
    name: str,
    badge_color: tuple,
    width: int = PANEL_WIDTH,
    height: int = PANEL_HEIGHT,
) -> np.ndarray:
    """Generate a clean, high-polish cartoon hamster placeholder graphic."""
    img = np.zeros((height, width, 3), dtype=np.uint8)

    # Soft gradient background
    c1 = np.array([28, 22, 28], dtype=float)
    c2 = np.array([45, 36, 48], dtype=float)
    for y in range(height):
        factor = y / float(height)
        color = (1.0 - factor) * c1 + factor * c2
        img[y, :] = color.astype(np.uint8)

    center_x = width // 2
    center_y = height // 2 + 10

    # Draw hamster ears
    ear_color = (130, 160, 210)
    inner_ear = (170, 190, 240)
    # Left ear
    cv2.circle(img, (center_x - 90, center_y - 120), 45, ear_color, -1, cv2.LINE_AA)
    cv2.circle(img, (center_x - 90, center_y - 120), 28, inner_ear, -1, cv2.LINE_AA)
    # Right ear
    cv2.circle(img, (center_x + 90, center_y - 120), 45, ear_color, -1, cv2.LINE_AA)
    cv2.circle(img, (center_x + 90, center_y - 120), 28, inner_ear, -1, cv2.LINE_AA)

    # Hamster Body / Head
    body_color = (150, 190, 230)
    cv2.ellipse(img, (center_x, center_y), (140, 125), 0, 0, 360, body_color, -1, cv2.LINE_AA)

    # Cheeks / Belly patch
    cheek_color = (200, 225, 250)
    cv2.ellipse(img, (center_x, center_y + 35), (105, 80), 0, 0, 360, cheek_color, -1, cv2.LINE_AA)

    # Blushing cheeks
    blush_color = (160, 150, 255)
    cv2.circle(img, (center_x - 75, center_y + 20), 24, blush_color, -1, cv2.LINE_AA)
    cv2.circle(img, (center_x + 75, center_y + 20), 24, blush_color, -1, cv2.LINE_AA)

    # Eyes based on reaction
    eye_color = (30, 20, 25)
    if "side_eye" in name.lower():
        # Looking sideways
        cv2.circle(img, (center_x - 45, center_y - 20), 16, (255, 255, 255), -1, cv2.LINE_AA)
        cv2.circle(img, (center_x + 45, center_y - 20), 16, (255, 255, 255), -1, cv2.LINE_AA)
        cv2.circle(img, (center_x - 35, center_y - 20), 10, eye_color, -1, cv2.LINE_AA)
        cv2.circle(img, (center_x + 55, center_y - 20), 10, eye_color, -1, cv2.LINE_AA)
    elif "sad" in name.lower():
        # Teary droopy eyes
        cv2.ellipse(img, (center_x - 45, center_y - 15), (16, 12), -20, 0, 360, eye_color, -1, cv2.LINE_AA)
        cv2.ellipse(img, (center_x + 45, center_y - 15), (16, 12), 20, 0, 360, eye_color, -1, cv2.LINE_AA)
        cv2.circle(img, (center_x - 45, center_y + 10), 6, (240, 180, 100), -1, cv2.LINE_AA)
    else:
        # Cute sparkling eyes
        cv2.circle(img, (center_x - 45, center_y - 20), 16, eye_color, -1, cv2.LINE_AA)
        cv2.circle(img, (center_x + 45, center_y - 20), 16, eye_color, -1, cv2.LINE_AA)
        cv2.circle(img, (center_x - 49, center_y - 24), 6, (255, 255, 255), -1, cv2.LINE_AA)
        cv2.circle(img, (center_x + 41, center_y - 24), 6, (255, 255, 255), -1, cv2.LINE_AA)

    # Cute nose
    cv2.circle(img, (center_x, center_y + 5), 8, (120, 110, 220), -1, cv2.LINE_AA)

    # Mouth line
    cv2.ellipse(img, (center_x - 10, center_y + 20), (10, 8), 0, 0, 180, (50, 40, 50), 2, cv2.LINE_AA)
    cv2.ellipse(img, (center_x + 10, center_y + 20), (10, 8), 0, 0, 180, (50, 40, 50), 2, cv2.LINE_AA)

    # Whiskers
    cv2.line(img, (center_x - 65, center_y + 10), (center_x - 115, center_y + 5), (60, 50, 60), 2, cv2.LINE_AA)
    cv2.line(img, (center_x - 65, center_y + 20), (center_x - 115, center_y + 25), (60, 50, 60), 2, cv2.LINE_AA)
    cv2.line(img, (center_x + 65, center_y + 10), (center_x + 115, center_y + 5), (60, 50, 60), 2, cv2.LINE_AA)
    cv2.line(img, (center_x + 65, center_y + 20), (center_x + 115, center_y + 25), (60, 50, 60), 2, cv2.LINE_AA)

    # Label Banner
    banner_y = height - 90
    cv2.rectangle(img, (center_x - 180, banner_y), (center_x + 180, banner_y + 44), badge_color, -1, cv2.LINE_AA)
    cv2.rectangle(img, (center_x - 180, banner_y), (center_x + 180, banner_y + 44), (255, 255, 255), 1, cv2.LINE_AA)

    (tw, th), _ = cv2.getTextSize(name.upper(), cv2.FONT_HERSHEY_DUPLEX, 0.7, 1)
    cv2.putText(
        img,
        name.upper(),
        (center_x - tw // 2, banner_y + 30),
        cv2.FONT_HERSHEY_DUPLEX,
        0.7,
        (255, 255, 255),
        1,
        cv2.LINE_AA,
    )

    return img


def load_reaction_images() -> Dict[str, np.ndarray]:
    """
    Ensure all reaction images exist (downloading if needed)
    and load them into a dictionary of resized BGR numpy arrays.
    """
    ensure_directories()
    images: Dict[str, np.ndarray] = {}

    for key, meta in REACTIONS.items():
        image_path = IMAGES_DIR / meta.image_filename
        if not image_path.exists() or image_path.stat().st_size == 0:
            encoded_filename = urllib.parse.quote(meta.image_filename) if "urllib" in globals() else meta.image_filename.replace(" ", "%20")
            url = f"{REFERENCE_IMAGES_BASE_URL}/{encoded_filename}"
            download_file(url, image_path, desc=f"Meme '{meta.display_name}'")

        img = None
        if image_path.exists() and image_path.stat().st_size > 0:
            img = cv2.imread(str(image_path))

        if img is None:
            logger.warning(
                "Image for %s not found or unreadable. Generating high-polish cartoon hamster.",
                key,
            )
            img = generate_fallback_hamster(meta.display_name, meta.badge_color)

        images[key] = cv2.resize(img, (PANEL_WIDTH, PANEL_HEIGHT), interpolation=cv2.INTER_AREA)

    return images
