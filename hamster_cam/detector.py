import logging
import math
from collections import Counter, deque
from dataclasses import dataclass, field
from typing import Any, List, Optional, Tuple

import cv2
import numpy as np

from hamster_cam.config import (
    BICEP_ANGLE_MAX_DEG,
    BICEP_ELBOW_OUT_MIN,
    BICEP_WRIST_ABOVE_MIN,
    FACE_MODEL_FILE,
    FINGER_JOINTS,
    GLASSES_FACE_DIST_MAX,
    HAND_MODEL_FILE,
    HANDS_APART_DIST_MIN,
    HANDS_TOGETHER_DIST_MAX,
    HUG_BELOW_FACE_MIN,
    MOUTH_LANDMARK_IDX,
    MOUTH_PROXIMITY_DIST_MAX,
    PINCH_MAX_DIST_RATIO,
    PINCH_MIDDLE_RATIO,
    PITCH_THRESHOLD_DEG,
    POSE_LEFT_ELBOW,
    POSE_LEFT_HIP,
    POSE_LEFT_SHOULDER,
    POSE_LEFT_WRIST,
    POSE_MODEL_FILE,
    POSE_RIGHT_ELBOW,
    POSE_RIGHT_HIP,
    POSE_RIGHT_SHOULDER,
    POSE_RIGHT_WRIST,
    POSE_VISIBILITY_MIN,
    SHY_FACE_DIST_MAX,
    SHY_HEIGHT_TOLERANCE,
    THINKING_MOUTH_DIST_MAX,
    VOTING_MAJORITY_COUNT,
    VOTING_WINDOW_SIZE,
    YAW_THRESHOLD_DEG,
)

logger = logging.getLogger(__name__)


def _dist(p1: Any, p2: Any) -> float:
    """Euclidean distance between two normalized 2D/3D points."""
    return float(((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) ** 0.5)


def _landmarks_center(landmarks: List[Any]) -> np.ndarray:
    """Center coordinates of a landmark sequence."""
    cx = sum(p.x for p in landmarks) / len(landmarks)
    cy = sum(p.y for p in landmarks) / len(landmarks)
    return np.array([cx, cy], dtype=float)


@dataclass
class DetectionState:
    """Holds instantaneous detection values and smoothed results."""
    raw_gesture: str = "default"
    stable_gesture: str = "default"
    yaw_deg: Optional[float] = None
    pitch_deg: Optional[float] = None
    hand_count: int = 0
    fingers_state: Optional[List[int]] = None
    is_pinch: bool = False
    pinch_ratio: float = 0.0
    thumb_dy: Optional[float] = None
    pointer_shape: bool = False
    cross_arms: bool = False
    mouth_dist: Optional[float] = None
    face_dist: Optional[float] = None
    bicep_angle: Optional[float] = None
    wrist_above_shoulder: Optional[float] = None
    elbow_out: Optional[float] = None
    hands_dist: Optional[float] = None
    hands_to_mouth: Optional[float] = None
    hands_below_face: Optional[float] = None
    face_center: Optional[Tuple[float, float]] = None
    hand_landmarks_list: List[Any] = field(default_factory=list)


class HamsterGestureDetector:
    """
    Orchestrates MediaPipe Hand, Face, and Pose landmarkers with
    rule-based geometric classifiers and temporal majority voting.
    """

    def __init__(self):
        self.hand_landmarker: Any = None
        self.face_landmarker: Any = None
        self.pose_landmarker: Any = None
        self.models_available = False

        self.vote_history: deque = deque(maxlen=VOTING_WINDOW_SIZE)
        self.stable_gesture = "default"
        self.frame_timestamp_ms = 0

        self.init_models()

    def init_models(self) -> bool:
        """Initialize MediaPipe task landmarker instances."""
        try:
            import mediapipe as mp
            from mediapipe.tasks.python import BaseOptions
            from mediapipe.tasks.python.vision import (
                FaceLandmarker,
                FaceLandmarkerOptions,
                HandLandmarker,
                HandLandmarkerOptions,
                PoseLandmarker,
                PoseLandmarkerOptions,
                RunningMode,
            )

            if not (HAND_MODEL_FILE.exists() and FACE_MODEL_FILE.exists() and POSE_MODEL_FILE.exists()):
                logger.warning("One or more MediaPipe models are missing.")
                self.models_available = False
                return False

            logger.info("Initializing MediaPipe HandLandmarker...")
            hand_options = HandLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=str(HAND_MODEL_FILE)),
                running_mode=RunningMode.VIDEO,
                num_hands=2,
                min_hand_detection_confidence=0.6,
                min_tracking_confidence=0.6,
            )
            self.hand_landmarker = HandLandmarker.create_from_options(hand_options)

            logger.info("Initializing MediaPipe FaceLandmarker...")
            face_options = FaceLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=str(FACE_MODEL_FILE)),
                running_mode=RunningMode.VIDEO,
                num_faces=1,
                min_face_detection_confidence=0.6,
                min_tracking_confidence=0.6,
                output_facial_transformation_matrixes=True,
            )
            self.face_landmarker = FaceLandmarker.create_from_options(face_options)

            logger.info("Initializing MediaPipe PoseLandmarker...")
            pose_options = PoseLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=str(POSE_MODEL_FILE)),
                running_mode=RunningMode.VIDEO,
                num_poses=1,
                min_pose_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )
            self.pose_landmarker = PoseLandmarker.create_from_options(pose_options)

            self.models_available = True
            logger.info("All MediaPipe vision models initialized successfully.")
            return True

        except Exception as exc:
            logger.warning("MediaPipe initialization error: %s", exc)
            self.models_available = False
            return False

    def close(self) -> None:
        """Clean up MediaPipe resources."""
        for landmarker in (self.hand_landmarker, self.face_landmarker, self.pose_landmarker):
            if landmarker is not None:
                try:
                    landmarker.close()
                except Exception as exc:
                    logger.debug("Error closing landmarker: %s", exc)
        self.hand_landmarker = None
        self.face_landmarker = None
        self.pose_landmarker = None
        self.models_available = False

    # ---------------------------------------------------------
    # Geometric and Heuristic Functions
    # ---------------------------------------------------------
    @staticmethod
    def get_fingers_extension(landmarks: List[Any]) -> List[int]:
        """
        Determines [Thumb, Index, Middle, Ring, Pinky] extension status (1 = extended, 0 = curled).
        Thumb extension is measured relative to pinky MCP (landmark 17) for rotation invariance.
        """
        wrist = landmarks[0]
        pinky_base = landmarks[17]

        # Thumb: extended if tip-to-pinky_base > IP-to-pinky_base * 1.10
        thumb_extended = _dist(landmarks[4], pinky_base) > _dist(landmarks[2], pinky_base) * 1.10
        fingers = [1 if thumb_extended else 0]

        # Other 4 fingers: tip distance from wrist vs knuckle MCP from wrist
        for tip_id, base_id in FINGER_JOINTS:
            extended = _dist(wrist, landmarks[tip_id]) > _dist(wrist, landmarks[base_id]) * 1.15
            fingers.append(1 if extended else 0)

        return fingers

    @staticmethod
    def classify_hand_shape(fingers: List[int]) -> Optional[str]:
        """Classify single hand state based on finger extensions."""
        thumb, index, middle, ring, pinky = fingers
        four_curled = not (index or middle or ring or pinky)

        if four_curled:
            return "thumbs_up" if thumb else "fist"
        if index and middle and ring and pinky and thumb:
            return "open_palm"
        if index and not middle and not ring and not pinky:
            return "pointer"
        return None

    @staticmethod
    def thumb_dy_ratio(landmarks: List[Any]) -> float:
        """Calculate wrist-relative vertical offset ratio of thumb tip."""
        scale = _dist(landmarks[0], landmarks[9])
        if scale < 1e-6:
            return 0.0
        return float((landmarks[4].y - landmarks[0].y) / scale)

    @classmethod
    def is_thumb_down(cls, landmarks: List[Any]) -> bool:
        """Check if thumb is pointing vertically downwards relative to wrist."""
        return cls.thumb_dy_ratio(landmarks) > 0.35

    @staticmethod
    def is_pinch_gesture(landmarks: List[Any]) -> Tuple[bool, float]:
        """Check if thumb tip and index tip form a pinch, distinguishing from a fist."""
        scale = _dist(landmarks[0], landmarks[9])
        if scale < 1e-6:
            return False, 999.0

        thumb_idx_dist = _dist(landmarks[4], landmarks[8])
        ratio = thumb_idx_dist / scale
        thumb_mid_dist = _dist(landmarks[4], landmarks[12])

        is_pinch = (thumb_idx_dist < scale * PINCH_MAX_DIST_RATIO) and (
            thumb_idx_dist < thumb_mid_dist * PINCH_MIDDLE_RATIO
        )
        return is_pinch, ratio

    @staticmethod
    def calculate_elbow_angle(shoulder: Any, elbow: Any, wrist: Any) -> Optional[float]:
        """Calculate shoulder-elbow-wrist joint interior angle in degrees."""
        v1 = np.array([shoulder.x - elbow.x, shoulder.y - elbow.y])
        v2 = np.array([wrist.x - elbow.x, wrist.y - elbow.y])
        norm1, norm2 = np.linalg.norm(v1), np.linalg.norm(v2)
        if norm1 < 1e-6 or norm2 < 1e-6:
            return None
        cos_ang = np.clip(np.dot(v1, v2) / (norm1 * norm2), -1.0, 1.0)
        return math.degrees(math.acos(cos_ang))

    @staticmethod
    def get_head_angles(face_transform_matrix: Any) -> Tuple[Optional[float], Optional[float]]:
        """Extract yaw and pitch in degrees from facial transformation matrix."""
        try:
            # R[0][2] = sin(yaw)
            r02 = face_transform_matrix[0][2]
            yaw = math.degrees(math.asin(max(-1.0, min(1.0, r02))))

            # -R[1][2] = sin(pitch)
            r12 = face_transform_matrix[1][2]
            pitch = math.degrees(math.asin(max(-1.0, min(1.0, -r12))))
            return yaw, pitch
        except Exception:
            return None, None

    def evaluate(self, frame_bgr: np.ndarray, timestamp_ms: int) -> DetectionState:
        """
        Run inference on the frame and classify current user gesture.
        Returns a rich DetectionState object.
        """
        state = DetectionState()
        if not self.models_available:
            if self.vote_history:
                top_gesture, top_count = Counter(self.vote_history).most_common(1)[0]
                if top_count >= VOTING_MAJORITY_COUNT:
                    self.stable_gesture = top_gesture
            state.stable_gesture = self.stable_gesture
            return state

        import mediapipe as mp

        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        try:
            hand_result = self.hand_landmarker.detect_for_video(mp_image, timestamp_ms)
            face_result = self.face_landmarker.detect_for_video(mp_image, timestamp_ms)
            pose_result = self.pose_landmarker.detect_for_video(mp_image, timestamp_ms)
        except Exception as exc:
            logger.debug("Inference error: %s", exc)
            return state

        # Head / Face extraction
        head_center = np.array([0.5, 0.3], dtype=float)
        mouth_point: Optional[np.ndarray] = None
        if face_result and face_result.face_landmarks:
            face_lms = face_result.face_landmarks[0]
            head_center = _landmarks_center(face_lms)
            state.face_center = (float(head_center[0]), float(head_center[1]))
            mouth_lm = face_lms[MOUTH_LANDMARK_IDX]
            mouth_point = np.array([mouth_lm.x, mouth_lm.y], dtype=float)

        if face_result and face_result.facial_transformation_matrixes:
            mat = face_result.facial_transformation_matrixes[0]
            state.yaw_deg, state.pitch_deg = self.get_head_angles(mat)

        # Hands extraction
        hand_landmarks_list = hand_result.hand_landmarks if hand_result else []
        state.hand_count = len(hand_landmarks_list)
        state.hand_landmarks_list = hand_landmarks_list

        pose_landmarks = pose_result.pose_landmarks[0] if (pose_result and pose_result.pose_landmarks) else None

        # Telemetry extraction for first hand (for HUD and debug display)
        if hand_landmarks_list:
            first_hand = hand_landmarks_list[0]
            first_c = _landmarks_center(first_hand)
            state.is_pinch, state.pinch_ratio = self.is_pinch_gesture(first_hand)
            state.thumb_dy = self.thumb_dy_ratio(first_hand)
            state.face_dist = float(np.linalg.norm(first_c - head_center))
            state.fingers_state = self.get_fingers_extension(first_hand)
            state.pointer_shape = (self.classify_hand_shape(state.fingers_state) == "pointer")
            if mouth_point is not None:
                fingertip = np.array([first_hand[8].x, first_hand[8].y], dtype=float)
                state.mouth_dist = float(np.linalg.norm(fingertip - mouth_point))

        detected = "default"

        # =============================================================
        # PRIORITY 1: Pinch near face (Glasses Hamster)
        # =============================================================
        for landmarks in hand_landmarks_list:
            hand_c = _landmarks_center(landmarks)
            is_p, _ = self.is_pinch_gesture(landmarks)
            face_d = float(np.linalg.norm(hand_c - head_center))
            if is_p and face_d < GLASSES_FACE_DIST_MAX:
                detected = "glasses"
                break

        # =============================================================
        # PRIORITY 2: Fist beside head (Lollipop) / Thumbs up / Thumbs down
        # =============================================================
        if detected == "default":
            # Check fist beside head (preserving lollipop hamster behavior)
            for landmarks in hand_landmarks_list:
                hand_c = _landmarks_center(landmarks)
                fingers = self.get_fingers_extension(landmarks)
                shape = self.classify_hand_shape(fingers)
                if shape in ("fist", "thumbs_up"):
                    dy = abs(hand_c[1] - head_center[1])
                    dx = abs(hand_c[0] - head_center[0])
                    if (dy < 0.15) and (0.08 < dx < 0.30):
                        detected = "fist_by_head"
                        break

            # If not beside head, check thumbs up / thumbs down away from face
            if detected == "default":
                for landmarks in hand_landmarks_list:
                    fingers = self.get_fingers_extension(landmarks)
                    shape = self.classify_hand_shape(fingers)
                    if shape == "thumbs_up":
                        detected = "thumbs_down" if self.is_thumb_down(landmarks) else "thumbs_up"
                        break

        # =============================================================
        # PRIORITY 3: Pointer gestures (Finger near mouth / Nerd)
        # =============================================================
        if detected == "default":
            # Check finger near mouth first
            for landmarks in hand_landmarks_list:
                fingers = self.get_fingers_extension(landmarks)
                if self.classify_hand_shape(fingers) == "pointer":
                    fingertip = np.array([landmarks[8].x, landmarks[8].y], dtype=float)
                    if mouth_point is not None:
                        m_dist = float(np.linalg.norm(fingertip - mouth_point))
                        if m_dist < MOUTH_PROXIMITY_DIST_MAX:
                            detected = "finger_mouth"
                            break

            # If not near mouth, check nerd (index finger raised away from mouth)
            if detected == "default":
                for landmarks in hand_landmarks_list:
                    fingers = self.get_fingers_extension(landmarks)
                    if self.classify_hand_shape(fingers) == "pointer":
                        detected = "nerd"
                        break

        # =============================================================
        # PRIORITY 4: Two-hand postures (Shy / Thinking / Hug)
        # =============================================================
        if detected == "default" and len(hand_landmarks_list) == 2:
            c1 = _landmarks_center(hand_landmarks_list[0])
            c2 = _landmarks_center(hand_landmarks_list[1])
            hands_dist = float(np.linalg.norm(c1 - c2))
            state.hands_dist = hands_dist
            avg_center = (c1 + c2) / 2.0

            # Shy: One hand touching each cheek (hands apart, face height)
            if hands_dist > HANDS_APART_DIST_MIN:
                on_cheeks = all(
                    np.linalg.norm(c - head_center) < SHY_FACE_DIST_MAX
                    and abs(c[1] - head_center[1]) < SHY_HEIGHT_TOLERANCE
                    for c in (c1, c2)
                )
                if on_cheeks:
                    detected = "shy"

            # Thinking / Hug: Hands clasped together
            elif hands_dist < HANDS_TOGETHER_DIST_MAX:
                if mouth_point is not None:
                    hands_to_mouth = float(np.linalg.norm(avg_center - mouth_point))
                    state.hands_to_mouth = hands_to_mouth
                    if hands_to_mouth < THINKING_MOUTH_DIST_MAX:
                        detected = "thinking"

                if detected == "default":
                    below_face = float(avg_center[1] - head_center[1])
                    state.hands_below_face = below_face
                    if below_face > HUG_BELOW_FACE_MIN:
                        detected = "hug"

        # =============================================================
        # PRIORITY 5: Pose gestures (Crossed arms / Bicep)
        # =============================================================
        if detected == "default" and pose_landmarks is not None:
            # Crossed arms: both wrists tucked close at chest height
            l_wrist, r_wrist = pose_landmarks[POSE_LEFT_WRIST], pose_landmarks[POSE_RIGHT_WRIST]
            l_sh, r_sh = pose_landmarks[POSE_LEFT_SHOULDER], pose_landmarks[POSE_RIGHT_SHOULDER]
            l_hip, r_hip = pose_landmarks[POSE_LEFT_HIP], pose_landmarks[POSE_RIGHT_HIP]

            wrists_visible = (
                getattr(l_wrist, "visibility", 1.0) >= POSE_VISIBILITY_MIN
                and getattr(r_wrist, "visibility", 1.0) >= POSE_VISIBILITY_MIN
            )
            shoulders_visible = (
                getattr(l_sh, "visibility", 1.0) >= POSE_VISIBILITY_MIN
                and getattr(r_sh, "visibility", 1.0) >= POSE_VISIBILITY_MIN
            )

            if wrists_visible and shoulders_visible:
                wrists_close = _dist(l_wrist, r_wrist) < 0.18
                chest_top = min(l_sh.y, r_sh.y)
                if (
                    getattr(l_hip, "visibility", 1.0) >= POSE_VISIBILITY_MIN
                    and getattr(r_hip, "visibility", 1.0) >= POSE_VISIBILITY_MIN
                ):
                    chest_bottom = max(l_hip.y, r_hip.y)
                else:
                    chest_bottom = chest_top + 0.35

                avg_wy = (l_wrist.y + r_wrist.y) / 2.0
                state.cross_arms = wrists_close and (chest_top < avg_wy < chest_bottom)
                if state.cross_arms:
                    detected = "cross_arms"

            # Bicep flex: bent elbow, wrist above shoulder, elbow out to side
            if detected == "default":
                best_bicep = None
                for sh_i, el_i, wr_i in (
                    (POSE_LEFT_SHOULDER, POSE_LEFT_ELBOW, POSE_LEFT_WRIST),
                    (POSE_RIGHT_SHOULDER, POSE_RIGHT_ELBOW, POSE_RIGHT_WRIST),
                ):
                    sh, el, wr = pose_landmarks[sh_i], pose_landmarks[el_i], pose_landmarks[wr_i]
                    if (
                        getattr(sh, "visibility", 1.0) >= POSE_VISIBILITY_MIN
                        and getattr(el, "visibility", 1.0) >= POSE_VISIBILITY_MIN
                        and getattr(wr, "visibility", 1.0) >= POSE_VISIBILITY_MIN
                    ):
                        angle = self.calculate_elbow_angle(sh, el, wr)
                        if angle is not None:
                            wrist_above = sh.y - wr.y  # positive = wrist above shoulder
                            elbow_out = abs(el.x - sh.x)  # positive = elbow away from torso
                            if best_bicep is None or angle < best_bicep[0]:
                                best_bicep = (angle, wrist_above, elbow_out)

                if best_bicep is not None:
                    state.bicep_angle, state.wrist_above_shoulder, state.elbow_out = best_bicep
                    if (
                        best_bicep[0] < BICEP_ANGLE_MAX_DEG
                        and best_bicep[1] > BICEP_WRIST_ABOVE_MIN
                        and best_bicep[2] > BICEP_ELBOW_OUT_MIN
                    ):
                        detected = "bicep"

        # =============================================================
        # PRIORITY 6: Two hands visible with no other gesture matched (Truck Hamster)
        # =============================================================
        if detected == "default" and len(hand_landmarks_list) == 2:
            detected = "two_hands"

        # =============================================================
        # PRIORITY 7: Head tilted downward (Sad Hamster)
        # =============================================================
        if detected == "default" and state.pitch_deg is not None:
            if state.pitch_deg > PITCH_THRESHOLD_DEG:
                detected = "sad"

        # =============================================================
        # PRIORITY 8: Head turned noticeably to the side (Side-Eye Hamster)
        # =============================================================
        if detected == "default" and state.yaw_deg is not None:
            if abs(state.yaw_deg) > YAW_THRESHOLD_DEG:
                detected = "side_eye"

        # =============================================================
        # PRIORITY 9: Default (Poker-Face Hamster)
        # =============================================================
        state.raw_gesture = detected

        # Temporal Majority Smoothing
        self.vote_history.append(detected)
        top_gesture, top_count = Counter(self.vote_history).most_common(1)[0]
        if top_count >= VOTING_MAJORITY_COUNT:
            self.stable_gesture = top_gesture

        state.stable_gesture = self.stable_gesture
        return state
