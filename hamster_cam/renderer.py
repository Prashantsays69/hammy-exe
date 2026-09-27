import math
import time
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

from hamster_cam.config import (
    COLOR_ACCENT_GREEN,
    COLOR_ACCENT_RED,
    COLOR_ACCENT_YELLOW,
    COLOR_APP_BG,
    COLOR_DIVIDER,
    COLOR_FOOTER_BG,
    COLOR_HEADER_BG,
    COLOR_PANEL_BORDER,
    COLOR_TEXT_MUTED,
    COLOR_TEXT_PRIMARY,
    FOOTER_HEIGHT,
    HAND_CONNECTIONS,
    HEADER_HEIGHT,
    PANEL_HEIGHT,
    PANEL_WIDTH,
    REACTIONS,
    ReactionMeta,
)
from hamster_cam.detector import DetectionState


class UIRenderer:
    """
    Renders a unified, high-polish application interface with
    dark-mode aesthetics, dynamic reaction badges, skeleton overlay,
    and a toggleable telemetry HUD.
    """

    def __init__(self, show_hud: bool = True):
        self.show_hud = show_hud
        self._start_time = time.time()

    def toggle_hud(self) -> bool:
        """Toggle HUD/debug overlay visibility."""
        self.show_hud = not self.show_hud
        return self.show_hud

    def draw_skeleton(
        self,
        panel: np.ndarray,
        hand_landmarks_list: List[Any],
        crop_meta: Tuple[int, int, int, int],
    ) -> None:
        """Draw anti-aliased hand skeleton bones and joints."""
        orig_w, orig_h, crop_x0, crop_y0 = crop_meta
        scale_x = PANEL_WIDTH / max(1, min(orig_w, orig_h))
        scale_y = PANEL_HEIGHT / max(1, min(orig_w, orig_h))

        for landmarks in hand_landmarks_list:
            points = []
            for p in landmarks:
                # Map from uncropped normalized to cropped square coordinates
                px = int((p.x * orig_w - crop_x0) * scale_x)
                py = int((p.y * orig_h - crop_y0) * scale_y)
                points.append((px, py))

            # Draw bones
            for a, b in HAND_CONNECTIONS:
                if a < len(points) and b < len(points):
                    cv2.line(panel, points[a], points[b], (80, 235, 120), 2, cv2.LINE_AA)

            # Draw joints
            for idx, pt in enumerate(points):
                color = (40, 180, 255) if idx in (4, 8, 12, 16, 20) else (240, 70, 90)
                radius = 4 if idx in (4, 8, 12, 16, 20) else 3
                cv2.circle(panel, pt, radius, color, -1, cv2.LINE_AA)

    def draw_hud_overlay(self, panel: np.ndarray, state: DetectionState) -> None:
        """Render a sleek, semi-transparent telemetry HUD on the camera panel."""
        hud_h = 175
        overlay = panel[:hud_h, :].copy()
        cv2.rectangle(overlay, (0, 0), (PANEL_WIDTH, hud_h), (12, 10, 14), -1)
        cv2.addWeighted(overlay, 0.65, panel[:hud_h, :], 0.35, 0, panel[:hud_h, :])

        # Bottom accent line of HUD
        cv2.line(panel, (0, hud_h), (PANEL_WIDTH, hud_h), (60, 48, 65), 1, cv2.LINE_AA)

        lines = []
        yaw_s = f"{state.yaw_deg:.1f}" if state.yaw_deg is not None else "n/a"
        pitch_s = f"{state.pitch_deg:.1f}" if state.pitch_deg is not None else "n/a"
        lines.append(f"yaw={yaw_s}  pitch={pitch_s}")

        fingers_s = str(state.fingers_state) if state.fingers_state is not None else "None"
        lines.append(f"fingers T,I,M,R,P={fingers_s}")

        thumb_dy_s = f"{state.thumb_dy:.2f}" if state.thumb_dy is not None else "n/a"
        face_dist_s = f"{state.face_dist:.2f}" if state.face_dist is not None else "n/a"
        lines.append(f"pinch={state.is_pinch} ({state.pinch_ratio:.2f})  thumb_dy={thumb_dy_s}  face_dist={face_dist_s}")

        mouth_dist_s = f"{state.mouth_dist:.2f}" if state.mouth_dist is not None else "n/a"
        lines.append(f"pointer_shape={state.pointer_shape}  mouth_dist={mouth_dist_s}")

        if state.bicep_angle is not None:
            bicep_s = f"bicep angle={state.bicep_angle:.0f} wrist_above={state.wrist_above_shoulder:.2f} elbow_out={state.elbow_out:.2f}"
        else:
            bicep_s = "bicep: arm not clearly visible"
        lines.append(f"cross_arms={state.cross_arms}  {bicep_s}")

        hands_d_s = f"{state.hands_dist:.2f}" if state.hands_dist is not None else "n/a"
        h_mouth_s = f"{state.hands_to_mouth:.2f}" if state.hands_to_mouth is not None else "n/a"
        h_below_s = f"{state.hands_below_face:.2f}" if state.hands_below_face is not None else "n/a"
        lines.append(f"hands_dist={hands_d_s}  mouth_dist={h_mouth_s}  below_face={h_below_s}")

        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.45
        y_pos = 24
        for line in lines:
            cv2.putText(panel, line, (14, y_pos), font, font_scale, (0, 255, 255), 1, cv2.LINE_AA)
            y_pos += 25

    def compose_frame(
        self,
        meme_image: np.ndarray,
        camera_frame: np.ndarray,
        state: DetectionState,
        fps: float,
        is_paused: bool = False,
        crop_meta: Optional[Tuple[int, int, int, int]] = None,
    ) -> np.ndarray:
        """
        Assemble the full 1280x728 application window with headers,
        reactions, side-by-side feeds, and footer controls.
        """
        cam_view = camera_frame.copy()

        # Draw hand skeletons if landmarks exist
        if crop_meta and state.hand_landmarks_list:
            self.draw_skeleton(cam_view, state.hand_landmarks_list, crop_meta)

        # Draw face tracking reticle if face detected
        if crop_meta and state.face_center is not None:
            orig_w, orig_h, crop_x0, crop_y0 = crop_meta
            scale_x = PANEL_WIDTH / max(1, min(orig_w, orig_h))
            scale_y = PANEL_HEIGHT / max(1, min(orig_w, orig_h))
            fx = int((state.face_center[0] * orig_w - crop_x0) * scale_x)
            fy = int((state.face_center[1] * orig_h - crop_y0) * scale_y)
            cv2.circle(cam_view, (fx, fy), 4, (80, 220, 255), -1, cv2.LINE_AA)
            cv2.circle(cam_view, (fx, fy), 18, (80, 220, 255), 1, cv2.LINE_AA)

        # Draw HUD if enabled
        if self.show_hud:
            self.draw_hud_overlay(cam_view, state)

        # If camera is paused, overlay a subtle paused scrim
        if is_paused:
            scrim = cam_view.copy()
            cv2.rectangle(scrim, (0, 0), (PANEL_WIDTH, PANEL_HEIGHT), (20, 15, 25), -1)
            cv2.addWeighted(scrim, 0.55, cam_view, 0.45, 0, cam_view)
            cv2.putText(
                cam_view,
                "CAMERA PAUSED",
                (PANEL_WIDTH // 2 - 120, PANEL_HEIGHT // 2),
                cv2.FONT_HERSHEY_DUPLEX,
                0.8,
                COLOR_TEXT_PRIMARY,
                2,
                cv2.LINE_AA,
            )
            cv2.putText(
                cam_view,
                "Press 'S' to resume camera feed",
                (PANEL_WIDTH // 2 - 145, PANEL_HEIGHT // 2 + 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                COLOR_TEXT_MUTED,
                1,
                cv2.LINE_AA,
            )

        # Side-by-side composition
        dual_stage = np.hstack((meme_image, cam_view))

        # Draw vertical divider
        divider_x = PANEL_WIDTH
        cv2.line(dual_stage, (divider_x - 1, 0), (divider_x - 1, PANEL_HEIGHT), COLOR_DIVIDER, 1)
        cv2.line(dual_stage, (divider_x, 0), (divider_x, PANEL_HEIGHT), COLOR_PANEL_BORDER, 1)

        # Total canvas
        total_w = PANEL_WIDTH * 2
        total_h = HEADER_HEIGHT + PANEL_HEIGHT + FOOTER_HEIGHT
        canvas = np.zeros((total_h, total_w, 3), dtype=np.uint8)

        # Backgrounds
        canvas[:HEADER_HEIGHT] = COLOR_HEADER_BG
        canvas[HEADER_HEIGHT : HEADER_HEIGHT + PANEL_HEIGHT] = dual_stage
        canvas[HEADER_HEIGHT + PANEL_HEIGHT :] = COLOR_FOOTER_BG

        # Horizontal separator lines
        cv2.line(canvas, (0, HEADER_HEIGHT), (total_w, HEADER_HEIGHT), COLOR_PANEL_BORDER, 1)
        cv2.line(
            canvas,
            (0, HEADER_HEIGHT + PANEL_HEIGHT),
            (total_w, HEADER_HEIGHT + PANEL_HEIGHT),
            COLOR_PANEL_BORDER,
            1,
        )

        # -------------------------------------------------------------
        # Header Rendering
        # -------------------------------------------------------------
        # Pulsing Live Dot
        t = time.time() - self._start_time
        pulse = (math.sin(t * 3.5) + 1.0) / 2.0  # 0 to 1
        dot_color = (
            int(50 + pulse * 45),
            int(170 + pulse * 55),
            int(60 + pulse * 60),
        )
        dot_center = (24, HEADER_HEIGHT // 2)
        cv2.circle(canvas, dot_center, 8, (dot_color[0] // 3, dot_color[1] // 3, dot_color[2] // 3), -1, cv2.LINE_AA)
        cv2.circle(canvas, dot_center, 5, dot_color, -1, cv2.LINE_AA)

        # App Title & Subtitle
        cv2.putText(
            canvas,
            "HAMSTER REACTION CAM",
            (44, HEADER_HEIGHT // 2 + 6),
            cv2.FONT_HERSHEY_DUPLEX,
            0.65,
            COLOR_TEXT_PRIMARY,
            1,
            cv2.LINE_AA,
        )

        # FPS readout in header
        fps_text = f"{fps:.1f} FPS"
        cv2.putText(
            canvas,
            fps_text,
            (320, HEADER_HEIGHT // 2 + 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            COLOR_TEXT_MUTED,
            1,
            cv2.LINE_AA,
        )

        # Reaction Badge Pill (Top Right)
        reaction_meta = REACTIONS.get(state.stable_gesture, REACTIONS["default"])
        badge_text = f"Reaction: {reaction_meta.display_name.upper()}"
        (bw, bh), _ = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_DUPLEX, 0.6, 1)
        pad_x, pad_y = 16, 7
        pill_w = bw + pad_x * 2
        pill_h = bh + pad_y * 2
        pill_x0 = total_w - pill_w - 20
        pill_y0 = (HEADER_HEIGHT - pill_h) // 2

        # Pill background
        cv2.rectangle(
            canvas,
            (pill_x0, pill_y0),
            (pill_x0 + pill_w, pill_y0 + pill_h),
            reaction_meta.badge_color,
            -1,
            cv2.LINE_AA,
        )
        cv2.rectangle(
            canvas,
            (pill_x0, pill_y0),
            (pill_x0 + pill_w, pill_y0 + pill_h),
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )
        # Pill text
        cv2.putText(
            canvas,
            badge_text,
            (pill_x0 + pad_x, pill_y0 + pill_h - pad_y - 2),
            cv2.FONT_HERSHEY_DUPLEX,
            0.6,
            reaction_meta.text_color,
            1,
            cv2.LINE_AA,
        )

        # -------------------------------------------------------------
        # Left Panel Subtitle Overlay (Reaction Hint)
        # -------------------------------------------------------------
        hint_str = f"Trigger: {reaction_meta.hint}"
        (hw, _), _ = cv2.getTextSize(hint_str, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        hint_y = HEADER_HEIGHT + PANEL_HEIGHT - 16
        # Dark pill behind hint
        cv2.rectangle(
            canvas,
            (16, hint_y - 18),
            (28 + hw, hint_y + 8),
            (15, 12, 15),
            -1,
            cv2.LINE_AA,
        )
        cv2.putText(
            canvas,
            hint_str,
            (22, hint_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (220, 220, 230),
            1,
            cv2.LINE_AA,
        )

        # -------------------------------------------------------------
        # Footer Bar Rendering
        # -------------------------------------------------------------
        footer_y = HEADER_HEIGHT + PANEL_HEIGHT + FOOTER_HEIGHT // 2 + 5

        # Left controls
        controls_text = "[Q/ESC] Quit   [D] Toggle HUD   [S] Pause/Resume   [M] Mirror   [R] Reconnect"
        cv2.putText(
            canvas,
            controls_text,
            (20, footer_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.46,
            COLOR_TEXT_MUTED,
            1,
            cv2.LINE_AA,
        )

        # Right status
        hud_status = "HUD: ON" if self.show_hud else "HUD: OFF"
        cam_status = "CAM: PAUSED" if is_paused else "CAM: LIVE"
        right_info = f"{hud_status}  |  {cam_status}"
        (rw, _), _ = cv2.getTextSize(right_info, cv2.FONT_HERSHEY_SIMPLEX, 0.46, 1)
        cv2.putText(
            canvas,
            right_info,
            (total_w - rw - 20, footer_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.46,
            (180, 180, 190),
            1,
            cv2.LINE_AA,
        )

        return canvas
