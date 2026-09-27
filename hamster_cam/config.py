from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Tuple

# Base paths
PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_DIR.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
IMAGES_DIR = ASSETS_DIR / "images"
MODELS_DIR = ASSETS_DIR / "models"

# MediaPipe model paths
HAND_MODEL_FILE = MODELS_DIR / "hand_landmarker.task"
FACE_MODEL_FILE = MODELS_DIR / "face_landmarker.task"
POSE_MODEL_FILE = MODELS_DIR / "pose_landmarker.task"

# MediaPipe official model download endpoints
MODEL_URLS = {
    "hand": (
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
        "hand_landmarker/float16/latest/hand_landmarker.task"
    ),
    "face": (
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
        "face_landmarker/float16/latest/face_landmarker.task"
    ),
    "pose": (
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
        "pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
    ),
}

# Reference base URL for meme pictures
REFERENCE_IMAGES_BASE_URL = (
    "https://raw.githubusercontent.com/catherpiee/hammyhamster/main/images"
)


@dataclass(frozen=True)
class ReactionMeta:
    key: str
    display_name: str
    image_filename: str
    badge_color: Tuple[int, int, int]  # BGR
    text_color: Tuple[int, int, int]   # BGR
    hint: str


REACTIONS: Dict[str, ReactionMeta] = {
    "default": ReactionMeta(
        key="default",
        display_name="Poker-Face Hamster",
        image_filename="pokerham.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="No matching gesture",
    ),
    "thumbs_up": ReactionMeta(
        key="thumbs_up",
        display_name="Thumbs-Up Hamster",
        image_filename="thumb.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Thumbs up away from face",
    ),
    "thumbs_down": ReactionMeta(
        key="thumbs_down",
        display_name="Thumbs-Down Hamster",
        image_filename="thumbs down.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Thumbs down away from face",
    ),
    "fist_by_head": ReactionMeta(
        key="fist_by_head",
        display_name="Lollipop Hamster",
        image_filename="happylollypop.webp",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Closed fist beside head",
    ),
    "glasses": ReactionMeta(
        key="glasses",
        display_name="Glasses Hamster",
        image_filename="discord mod.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Thumb + index finger touching near face",
    ),
    "finger_mouth": ReactionMeta(
        key="finger_mouth",
        display_name="Finger-Near-Mouth Hamster",
        image_filename="one finger mouth .jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Index finger near mouth",
    ),
    "nerd": ReactionMeta(
        key="nerd",
        display_name="Nerd Hamster",
        image_filename="nerd.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Index finger raised away from mouth",
    ),
    "bicep": ReactionMeta(
        key="bicep",
        display_name="Bicep Hamster",
        image_filename="bicep.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Bent elbow + wrist above shoulder + elbow out",
    ),
    "cross_arms": ReactionMeta(
        key="cross_arms",
        display_name="Crossed-Arms Hamster",
        image_filename="cross arms .jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Both wrists together at chest height",
    ),
    "shy": ReactionMeta(
        key="shy",
        display_name="Shy Hamster",
        image_filename="cinamoroll ham.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="One hand touching each cheek",
    ),
    "thinking": ReactionMeta(
        key="thinking",
        display_name="Thinking Hamster",
        image_filename="think .jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Hands clasped near mouth/chin",
    ),
    "hug": ReactionMeta(
        key="hug",
        display_name="Hug Hamster",
        image_filename="plushie.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Hands clasped together at chest height below face",
    ),
    "sad": ReactionMeta(
        key="sad",
        display_name="Sad Hamster",
        image_filename="look down side .jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Head tilted downward",
    ),
    "two_hands": ReactionMeta(
        key="two_hands",
        display_name="Truck Hamster",
        image_filename="2 arms out .jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Two hands visible with no other gesture matched",
    ),
    "side_eye": ReactionMeta(
        key="side_eye",
        display_name="Side-Eye Hamster",
        image_filename="sideyee.jpg",
        badge_color=(200, 160, 255),
        text_color=(25, 20, 20),
        hint="Head turned noticeably to the side",
    ),
}

# UI Dimensions (per panel)
PANEL_WIDTH = 640
PANEL_HEIGHT = 640
HEADER_HEIGHT = 52
FOOTER_HEIGHT = 36

# Overall Window
WINDOW_TITLE = "Hamster Reaction Cam"

# Theme Colors (BGR)
COLOR_APP_BG = (18, 14, 18)
COLOR_HEADER_BG = (28, 22, 28)
COLOR_FOOTER_BG = (20, 16, 20)
COLOR_PANEL_BORDER = (55, 45, 60)
COLOR_DIVIDER = (45, 38, 50)
COLOR_TEXT_PRIMARY = (245, 245, 248)
COLOR_TEXT_MUTED = (150, 145, 155)
COLOR_ACCENT_GREEN = (95, 225, 120)
COLOR_ACCENT_RED = (80, 80, 235)
COLOR_ACCENT_YELLOW = (70, 210, 245)

# Detector Thresholds
YAW_THRESHOLD_DEG = 18.0
PITCH_THRESHOLD_DEG = 15.0
VOTING_WINDOW_SIZE = 12
VOTING_MAJORITY_COUNT = 7

# Proximity & Geometric thresholds
PINCH_MAX_DIST_RATIO = 0.50
PINCH_MIDDLE_RATIO = 0.70
GLASSES_FACE_DIST_MAX = 0.28
MOUTH_PROXIMITY_DIST_MAX = 0.14
BICEP_ANGLE_MAX_DEG = 100.0
BICEP_WRIST_ABOVE_MIN = 0.06
BICEP_ELBOW_OUT_MIN = 0.06
HANDS_TOGETHER_DIST_MAX = 0.12
HANDS_APART_DIST_MIN = 0.15
THINKING_MOUTH_DIST_MAX = 0.25
SHY_FACE_DIST_MAX = 0.30
SHY_HEIGHT_TOLERANCE = 0.18
HUG_BELOW_FACE_MIN = 0.20
POSE_VISIBILITY_MIN = 0.50

# Landmark indices
MOUTH_LANDMARK_IDX = 13
POSE_LEFT_SHOULDER, POSE_RIGHT_SHOULDER = 11, 12
POSE_LEFT_ELBOW, POSE_RIGHT_ELBOW = 13, 14
POSE_LEFT_WRIST, POSE_RIGHT_WRIST = 15, 16
POSE_LEFT_HIP, POSE_RIGHT_HIP = 23, 24

FINGER_JOINTS = [(8, 5), (12, 9), (16, 13), (20, 17)]
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17),
]
