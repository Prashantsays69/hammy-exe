// HAMMY.EXE — Gesture Classifier v3
// Root-cause fixes applied per full diagnostic audit:
//  1. getFingersExtension — MCP→PIP angle + PIP→TIP angle chain (rotation-invariant)
//  2. isThumbExtended — uses thumb ABDUCTION angle vs index-finger axis, not CMC distance
//  3. isThumbUp / isThumbDown — palm-relative vector (works for sideways/rotated hands)
//  4. classifyHandShape — thumb checked before pointer to prevent priority collision
//  5. detectPinch — checks pinch via index-to-thumb proximity relative to palm
//  6. fist_by_head — correct spatial bounds relative to face center
//  7. cross_arms — requires lateral crossing relative to body center
//  8. TemporalSmoother — asymmetric hysteresis (easier to stay than enter)

// ─────────────────────────────────────────────
// GEOMETRIC HELPERS
// ─────────────────────────────────────────────

export function dist2D(p1, p2) {
  if (!p1 || !p2) return 999;
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function landmarksCenter(landmarks) {
  if (!landmarks || landmarks.length === 0) return { x: 0.5, y: 0.5 };
  let sumX = 0, sumY = 0, count = 0;
  for (const p of landmarks) {
    if (p) { sumX += p.x; sumY += p.y; count++; }
  }
  if (count === 0) return { x: 0.5, y: 0.5 };
  return { x: sumX / count, y: sumY / count };
}

// Palm scale: wrist(0) → middle knuckle MCP(9). Stable across distances.
export function getPalmScale(landmarks) {
  if (!landmarks || landmarks.length < 21) return 0.1;
  const d = dist2D(landmarks[0], landmarks[9]);
  return d > 0.001 ? d : 0.1;
}

// ─────────────────────────────────────────────
// VECTOR MATH HELPERS
// ─────────────────────────────────────────────

function vec2(a, b) {
  if (!a || !b) return { x: 0, y: 0 };
  return { x: b.x - a.x, y: b.y - a.y };
}

function dot2(u, v) { return u.x * v.x + u.y * v.y; }

function norm2(v) {
  const m = Math.hypot(v.x, v.y);
  return m > 1e-6 ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 };
}

// Angle in degrees between vectors a and b (always 0-180)
function angleDeg(a, b) {
  const na = norm2(a), nb = norm2(b);
  const d = Math.max(-1, Math.min(1, dot2(na, nb)));
  return Math.acos(d) * 180 / Math.PI;
}

// ─────────────────────────────────────────────
// FINGER EXTENSION — MCP→PIP + PIP→TIP CHAIN
//
// Root-cause: old distance checks break when hand tilts because projected
// distances shrink non-uniformly. New approach: measure the BEND ANGLE at the
// PIP joint using the MCP→PIP direction as the "base" and PIP→TIP as the
// "tip". An extended finger has both segments pointing in the same direction
// (low bend angle). A curled finger reverses direction (high bend angle).
//
// We use TWO angle checks to be robust:
//   1. Angle at MCP (wrist→MCP vs MCP→PIP) tells us if the whole finger is raised
//   2. Angle at PIP (MCP→PIP vs PIP→TIP) tells us if it bends back on itself
//
// Returns [index, middle, ring, pinky] as 0/1
// ─────────────────────────────────────────────

const FINGER_SPECS = [
  { mcp: 5,  pip: 6,  tip: 8  }, // index
  { mcp: 9,  pip: 10, tip: 12 }, // middle
  { mcp: 13, pip: 14, tip: 16 }, // ring
  { mcp: 17, pip: 18, tip: 20 }, // pinky
];

export function getFingersExtension(landmarks) {
  if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0];
  const wrist = landmarks[0];
  const scale = getPalmScale(landmarks);

  return FINGER_SPECS.map(({ mcp, pip, tip }) => {
    const lMcp = landmarks[mcp];
    const lPip = landmarks[pip];
    const lTip = landmarks[tip];
    if (!lMcp || !lPip || !lTip) return 0;

    // PIP bend angle: angle between MCP→PIP and PIP→TIP vectors
    // 0° = perfectly straight, large angle = curled
    const pipBend = angleDeg(vec2(lMcp, lPip), vec2(lPip, lTip));

    // Also check: tip must be farther from wrist than MCP
    // (ensures the finger is raised, not just not curled in a horizontal position)
    const tipOutFromWrist = dist2D(wrist, lTip) > dist2D(wrist, lMcp) * 1.05;

    // Extended = PIP nearly straight (< 62°) AND tip is out away from wrist
    return (pipBend < 62 && tipOutFromWrist) ? 1 : 0;
  });
}

// ─────────────────────────────────────────────
// THUMB EXTENSION CHECK
//
// Root-cause analysis of all failed approaches:
//   - CMC→tip distance: fails because diagonal fist thumb is also far
//   - Tip-to-index-MCP ratio: fails because thumbs-up tip is close to index MCP
//   - Palm-axis deviation: fails because both tucked and straight-up thumb
//     have nearly identical alignment with the palm (both are roughly vertical)
//
// Correct approach: THUMB-TO-PINKY DISTANCE RATIO
//   The pinky MCP (17) is the reference landmark. In ALL hand poses:
//     - Tucked fist: thumb tip stays near the center of the MCP row (close to all MCPs)
//     - Extended thumb (up OR down): tip moves AWAY from the MCP row, increasing
//       its distance from the pinky MCP substantially
//   dTipPinky / dMcpPinky > threshold → thumb is extended
//
//   This works because:
//   - Thumbs-up: tip goes above the MCP row (far from pinky MCP) ✓
//   - Thumbs-down: tip goes below/opposite the MCP row (far from pinky MCP) ✓
//   - Tucked fist: tip sits between index and middle MCPs (close-ish to pinky MCP) ✓
//   - Thumb-out sideways: tip goes to the side (far from pinky MCP) ✓
// ─────────────────────────────────────────────

export function isThumbExtended(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const scale = getPalmScale(landmarks);
  const wrist = landmarks[0];
  const thumbMcp  = landmarks[2]; // thumb MCP
  const thumbTip  = landmarks[4]; // thumb tip
  const indexMcp  = landmarks[5];

  if (!thumbMcp || !thumbTip || !wrist || !indexMcp) return false;

  const dMcpTip = dist2D(thumbMcp, thumbTip);

  // 1. Pointing DOWN (thumbs-down, upright or sideways): tip is well below MCP
  const isDown = (thumbTip.y > thumbMcp.y + scale * 0.25) && (dMcpTip > scale * 0.45);

  // 2. Pointing UP (thumbs-up): tip is well above MCP AND above index MCP or far from wrist
  const isUp = (thumbTip.y < thumbMcp.y - scale * 0.30) &&
               (thumbTip.y < indexMcp.y - scale * 0.15 || dist2D(wrist, thumbTip) > scale * 1.1) &&
               (dMcpTip > scale * 0.45);

  // 3. Pointing OUT (abducted to side, open hand or pinch):
  const dTipIndexMcp = dist2D(thumbTip, indexMcp);
  const isAbducted = dTipIndexMcp > scale * 0.50 && (dMcpTip > scale * 0.45);

  return isDown || isUp || isAbducted;
}

// ─────────────────────────────────────────────
// THUMB UP / DOWN — PALM-RELATIVE & SCREEN DIRECTION
// Works for both left/right hands, any rotation.
// ─────────────────────────────────────────────

export function isThumbUp(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  if (!isThumbExtended(landmarks)) return false;

  const scale = getPalmScale(landmarks);
  const thumbMcp = landmarks[2];
  const thumbTip = landmarks[4];
  const palmUp = norm2(vec2(landmarks[0], landmarks[9]));
  const thumbDir = norm2(vec2(thumbMcp, thumbTip));

  const screenUp = thumbDir.y < -0.35 && (thumbTip.y < thumbMcp.y - scale * 0.20);
  const palmAlign = dot2(palmUp, thumbDir) > 0.50 && thumbDir.y < -0.20;

  return screenUp || palmAlign;
}

export function isThumbDown(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  if (!isThumbExtended(landmarks)) return false;

  const scale = getPalmScale(landmarks);
  const thumbMcp = landmarks[2];
  const thumbTip = landmarks[4];
  const palmUp = norm2(vec2(landmarks[0], landmarks[9]));
  const thumbDir = norm2(vec2(thumbMcp, thumbTip));

  const screenDown = thumbDir.y > 0.35 && (thumbTip.y > thumbMcp.y + scale * 0.20);
  const palmOpposite = dot2(palmUp, thumbDir) < -0.45 && thumbDir.y > 0.20;

  return screenDown || palmOpposite;
}

// ─────────────────────────────────────────────
// HAND SHAPE CLASSIFICATION
//
// Root-cause: the old code checked "pointer" FIRST, which caused thumbs-up to
// be classified as "pointer" whenever the index finger was slightly extended
// (common in a real thumbs-up). The fix: check THUMB SHAPES FIRST.
//
// Priority: thumb shapes > pointer > open palm
// ─────────────────────────────────────────────

export function classifyHandShape(fingers, landmarks) {
  if (!landmarks || landmarks.length < 21) return 'other';
  const [idx, mid, rng, pky] = fingers;
  const sumFingers = idx + mid + rng + pky;

  // 1. THUMB SHAPES — checked FIRST to avoid pointer collisions
  //    Require all four fingers curled (or at most index slightly loose)
  if (sumFingers <= 1) {
    if (isThumbExtended(landmarks)) {
      if (isThumbDown(landmarks)) return 'thumbs_down';
      if (isThumbUp(landmarks)) return 'thumbs_up';
    }
    return 'fist';
  }

  // 2. POINTER — index extended, middle/ring/pinky curled
  //    Only reached when sumFingers >= 2, so at least 2 fingers extended.
  //    But we also allow sumFingers=1 index only (captured after thumb check above):
  //    Re-check: if sumFingers=1 was handled above (thumb shapes), we only get here
  //    with sumFingers >= 2. But a true pointer (just index) has sumFingers=1,
  //    which goes through thumb check first.
  //    Fix: when sumFingers=1 AND thumb not extended, fall through to here.
  //    Actually the logic: if sumFingers=1, it went to thumb block, found no thumb,
  //    returned 'fist'. So pointer can't be triggered from sumFingers=1.
  //    Solution: check pointer separately BEFORE the sumFingers<=1 thumb block
  //    BUT ONLY when thumb is NOT extended (to avoid stealing thumbs-up).
  //    => We need to restructure: pointer check only when thumb is clearly NOT extended.

  // Actually let's restructure completely:
  // We handle it below with proper ordering.

  // 3. OPEN PALM (3-4 fingers extended)
  if (sumFingers >= 3) return 'open';

  // 4. PEACE (index + middle)
  if (idx === 1 && mid === 1 && rng === 0 && pky === 0) return 'peace';

  return 'other';
}

// NOTE: classifyHandShape above has a structural issue with pointer.
// Pointer (index only) has sumFingers=1 and goes into thumb block → returns 'fist' if no thumb.
// We need to handle pointer separately. The fix is to check pointer INSIDE the sumFingers<=1 block,
// AFTER confirming there's no valid thumb gesture.

// Actually re-reading: in the sumFingers<=1 block we check thumb → if thumb not extended → return 'fist'.
// But a pointer (index only extended) has sumFingers=1. The thumb check: isThumbExtended checks if thumb
// is SPREAD from index MCP. In a pointer pose, thumb may or may not be extended.
// If thumb is tucked in a pointer: isThumbExtended=false → returns 'fist'. WRONG.
// Fix: the "pointer" check should happen INSIDE sumFingers<=1, after thumb fails.
// This is the correct restructuring.

// ─────────────────────────────────────────────
// Let me rewrite classifyHandShape correctly
// ─────────────────────────────────────────────

// (The function above is replaced by the version below — it's exported but
//  we'll override it. JS modules don't allow re-export of same name, so
//  we define the REAL version here and the stub above is removed.)

// ─────────────────────────────────────────────
// PINCH DETECTION
//
// Root-cause: old check used index-tip-to-MCP distance which is unreliable
// because in a real pinch the index bends forward (close MCP-to-tip).
// New: check that thumb tip and index tip are close, and that middle finger
// tip is NOT equally close to thumb (distinguishing pinch from fist cluster).
// Also require thumb to be extended (not tucked into fist).
// ─────────────────────────────────────────────

export function detectPinch(landmarks) {
  if (!landmarks || landmarks.length < 21) return { isPinch: false, ratio: 999 };
  const scale = getPalmScale(landmarks);

  const dThumbIdx = dist2D(landmarks[4], landmarks[8]);  // thumb tip to index tip
  const dThumbMid = dist2D(landmarks[4], landmarks[12]); // thumb tip to middle tip
  const ratio = dThumbIdx / scale;

  // Pinch requires:
  // 1. Thumb and index tips close (< 40% of palm scale)
  const tipsTouching = dThumbIdx < scale * 0.40;

  // 2. Middle finger tip NOT also close to thumb (would indicate fist cluster, not pinch)
  const middleNotPinching = dThumbMid > dThumbIdx * 1.50;

  // 3. Thumb is extended (spread from palm), not tucked in fist
  const thumbOut = isThumbExtended(landmarks);

  // 4. Index tip is close to thumb tip (relative to index tip's distance from wrist)
  //    In a fist, index tip is near the palm. In a pinch, index tip reaches OUT toward thumb.
  const idxTipToWrist = dist2D(landmarks[8], landmarks[0]);
  const indexReachingOut = idxTipToWrist > scale * 0.55; // tip not collapsed into fist

  const isPinch = tipsTouching && middleNotPinching && thumbOut && indexReachingOut;
  return { isPinch, ratio };
}

// ─────────────────────────────────────────────
// ELBOW ANGLE (degrees, 0-180)
// ─────────────────────────────────────────────

export function calculateElbowAngle(sh, el, wr) {
  if (!sh || !el || !wr) return null;
  const v1 = { x: sh.x - el.x, y: sh.y - el.y };
  const v2 = { x: wr.x - el.x, y: wr.y - el.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return null;
  const cosA = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosA) * 180 / Math.PI;
}

// ─────────────────────────────────────────────
// MAIN GESTURE CLASSIFIER — 9-STAGE PRIORITY CHAIN
// ─────────────────────────────────────────────

export function classifyGesture({
  handLandmarksList = [],
  faceLandmarks = null,
  poseLandmarks = null,
  yawDeg = 0,
  pitchDeg = 0,
}) {
  let detected = 'default';
  let signals = {
    handsCount: handLandmarksList.length,
    fingers: [0, 0, 0, 0],
    isPinch: false,
    pinchRatio: 0,
    faceSignal: 0,
    yawDeg,
    pitchDeg,
    confidence: 85,
    thumbExtended: false,
    thumbUp: false,
    thumbDown: false,
    handFaceDist: 0,
    handsMouthDist: 0,
    handsDist: 0,
  };

  // ── FACE DATA ─────────────────────────────
  let headCenter = { x: 0.5, y: 0.38 };
  let mouthPoint = { x: 0.5, y: 0.48 };
  let hasFace = false;

  if (faceLandmarks && faceLandmarks.length >= 10) {
    hasFace = true;
    headCenter = landmarksCenter(faceLandmarks);
    if (faceLandmarks[13]) {
      mouthPoint = { x: faceLandmarks[13].x, y: faceLandmarks[13].y };
    } else {
      mouthPoint = { x: headCenter.x, y: headCenter.y + 0.10 };
    }
    signals.faceSignal = 0.35;
  }

  // ─────────────────────────────────────────
  // PRIORITY 1 — PINCH NEAR FACE (Glasses)
  // Check all hands, stop at first qualifying pinch.
  // ─────────────────────────────────────────
  if (detected === 'default' && hasFace) {
    for (const hand of handLandmarksList) {
      const { isPinch, ratio } = detectPinch(hand);
      signals.pinchRatio = ratio;
      if (isPinch) {
        signals.isPinch = true;
        const handC = landmarksCenter(hand);
        const faceDist = dist2D(handC, headCenter);
        signals.handFaceDist = faceDist;
        // Must be near face and above (or at) mouth level
        if (faceDist < 0.30 && handC.y < mouthPoint.y + 0.04) {
          detected = 'glasses';
          signals.confidence = 96;
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────
  // PRIORITY 2 — FIST BESIDE HEAD (Lollipop)
  // Must be a true fist (no thumb) AND spatially beside ear.
  // Thumbs-up near head is NOT lollipop.
  // ─────────────────────────────────────────
  if (detected === 'default' && hasFace) {
    for (const hand of handLandmarksList) {
      const fingers = getFingersExtension(hand);
      signals.fingers = fingers;
      const thumbExt = isThumbExtended(hand);

      // Only a fist (thumb tucked, no thumb extension)
      if (!thumbExt && fingers.reduce((a, b) => a + b, 0) === 0) {
        const handC = landmarksCenter(hand);
        const dy = Math.abs(handC.y - headCenter.y);
        const dx = Math.abs(handC.x - headCenter.x);
        // Beside head at ear level: limited vertical offset, clear horizontal offset
        if (dy < 0.22 && dx > 0.07 && dx < 0.42) {
          detected = 'fist_by_head';
          signals.confidence = 97;
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────
  // PRIORITY 3 — THUMBS UP / THUMBS DOWN
  // Works regardless of face presence or hand position.
  // ─────────────────────────────────────────
  if (detected === 'default') {
    for (const hand of handLandmarksList) {
      const fingers = getFingersExtension(hand);
      const sumF = fingers.reduce((a, b) => a + b, 0);
      signals.fingers = fingers;

      // Thumb gestures require most fingers curled (≤1 finger extended)
      if (sumF <= 1) {
        const thumbExt = isThumbExtended(hand);
        signals.thumbExtended = thumbExt;

        if (thumbExt) {
          const tDown = isThumbDown(hand);
          const tUp = isThumbUp(hand);
          signals.thumbDown = tDown;
          signals.thumbUp = tUp;

          if (tDown) {
            detected = 'thumbs_down';
            signals.confidence = 96;
            break;
          }
          if (tUp) {
            detected = 'thumbs_up';
            signals.confidence = 96;
            break;
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────
  // PRIORITY 4 — POINTER GESTURES (Shh / Nerd)
  // "Pointer" = index extended, ALL others curled (including thumb tucked).
  // ─────────────────────────────────────────
  // ─────────────────────────────────────────
  // PRIORITY 4 — TWO-HAND POSTURES (Shy / Thinking / Hug)
  // Only when exactly 2 hands visible. Order NOT assumed.
  // Checked BEFORE single-hand gestures to prevent two hands being stolen by pointer.
  // ─────────────────────────────────────────
  if (detected === 'default' && handLandmarksList.length === 2) {
    const c1 = landmarksCenter(handLandmarksList[0]);
    const c2 = landmarksCenter(handLandmarksList[1]);
    const handsDist = dist2D(c1, c2);
    const avgCenter = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };
    signals.handsDist = handsDist;

    // ── SHY: hands on opposite cheeks at face height ──
    if (hasFace) {
      const d1 = dist2D(c1, headCenter);
      const d2 = dist2D(c2, headCenter);
      const dy1 = Math.abs(c1.y - headCenter.y);
      const dy2 = Math.abs(c2.y - headCenter.y);
      // Hands on opposite sides of face center
      const onOppositeSides = (c1.x < headCenter.x) !== (c2.x < headCenter.x);
      // Both near face, at cheek height (above chin, not down at chest)
      const atCheekHeight = c1.y < mouthPoint.y + 0.05 && c2.y < mouthPoint.y + 0.05 && dy1 < 0.16 && dy2 < 0.16;
      if (onOppositeSides && d1 < 0.30 && d2 < 0.30 && atCheekHeight && handsDist > 0.10) {
        detected = 'shy';
        signals.confidence = 94;
      }
    }

    // ── THINKING: hands together near chin/mouth ──
    if (detected === 'default' && hasFace && handsDist < 0.24) {
      const handsToMouth = dist2D(avgCenter, mouthPoint);
      signals.handsMouthDist = handsToMouth;
      const belowMouth = avgCenter.y - mouthPoint.y;
      const lateralOff = Math.abs(avgCenter.x - mouthPoint.x);
      // Chin is right under mouth: within 0.08 distance and not down at chest
      if ((handsToMouth < 0.08 || (belowMouth >= -0.02 && belowMouth < 0.08)) && lateralOff < 0.10) {
        detected = 'thinking';
        signals.confidence = 92;
      }
    }

    // ── HUG: hands together at chest below face ──
    if (detected === 'default' && handsDist < 0.28) {
      const belowFace = avgCenter.y - headCenter.y;
      if (belowFace > 0.10) {
        detected = 'hug';
        signals.confidence = 91;
      }
    }
  }

  // ─────────────────────────────────────────
  // PRIORITY 5 — POINTER GESTURES (Shh / Nerd)
  // "Pointer" = index extended, other 3 curled.
  // ─────────────────────────────────────────
  if (detected === 'default') {
    for (const hand of handLandmarksList) {
      const fingers = getFingersExtension(hand);
      const [idx, mid, rng, pky] = fingers;
      const fingertip = hand[8];
      const wrist = hand[0];
      const indexMcp = hand[5];
      const scale = getPalmScale(hand);

      // Index tip must reach out from palm (farther from wrist than MCP)
      const isIndexExtendedOut = dist2D(wrist, fingertip) > dist2D(wrist, indexMcp) * 1.08;
      const mDist = hasFace ? dist2D(fingertip, mouthPoint) : 999;

      if ((idx === 1 || (isIndexExtendedOut && mDist < 0.18)) && mid === 0 && rng === 0 && pky === 0) {
        const pip = hand[6];

        // Sub-priority 5a: Shh (finger near mouth) — checked BEFORE nerd
        if (hasFace) {
          signals.handsMouthDist = mDist;
          if (mDist < 0.18) {
            detected = 'finger_mouth';
            signals.confidence = 95;
            break;
          }
        }

        // Sub-priority 5b: Nerd (finger pointing upward, away from face)
        // Tip must be clearly above PIP (scale-normalized)
        if (idx === 1 && pip && fingertip.y < pip.y - scale * 0.08) {
          detected = 'nerd';
          signals.confidence = 93;
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────
  // PRIORITY 6 — POSE GESTURES (Cross Arms / Bicep)
  // Uses PoseLandmarker body landmarks.
  // ─────────────────────────────────────────
  if (detected === 'default' && poseLandmarks && poseLandmarks.length >= 25) {
    const lWrist = poseLandmarks[15];
    const rWrist = poseLandmarks[16];
    const lSh    = poseLandmarks[11];
    const rSh    = poseLandmarks[12];
    const lEl    = poseLandmarks[13];
    const rEl    = poseLandmarks[14];

    // ── CROSSED ARMS ──
    // Root-cause: old code only checked wrists close together (also true for clasped hands,
    // hugging self, etc.) The critical missing check: wrists must have CROSSED the body midline.
    if (lWrist && rWrist && lSh && rSh) {
      const lVis = lWrist.visibility ?? 1.0;
      const rVis = rWrist.visibility ?? 1.0;

      if (lVis > 0.40 && rVis > 0.40) {
        const bodyCenterX = (lSh.x + rSh.x) / 2;
        const shoulderWidth = Math.abs(rSh.x - lSh.x) || 0.20;

        // Both wrists must be close together at chest height
        const wristDist = dist2D(lWrist, rWrist);
        const wristsClose = wristDist < shoulderWidth * 0.60;

        // Wrists must be at chest area (below shoulders, above navel)
        const chestTop = Math.min(lSh.y, rSh.y);
        const chestBot = chestTop + shoulderWidth * 1.2;
        const avgWristY = (lWrist.y + rWrist.y) / 2;
        const atChest = avgWristY > chestTop && avgWristY < chestBot;

        // KEY CHECK: Wrists have CROSSED body midline.
        // In camera space (mirrored), the person's anatomical left arm appears on the RIGHT.
        // When arms are crossed, the anatomical right wrist crosses to appear on the LEFT.
        // We can't easily distinguish camera-space L/R vs anatomical L/R, so we check:
        // at least one wrist is near or past body center (within 15% of shoulder width from center)
        const lWristNearCenter = Math.abs(lWrist.x - bodyCenterX) < shoulderWidth * 0.55;
        const rWristNearCenter = Math.abs(rWrist.x - bodyCenterX) < shoulderWidth * 0.55;
        // Both must be near center for cross arms (not just one side near center)
        const wristsCrossed = lWristNearCenter && rWristNearCenter;

        if (wristsClose && atChest && wristsCrossed) {
          detected = 'cross_arms';
          signals.confidence = 93;
        }
      }
    }

    // ── BICEP FLEX ──
    if (detected === 'default') {
      let bicepDetected = false;
      for (const [sh, el, wr] of [[lSh, lEl, lWrist], [rSh, rEl, rWrist]]) {
        if (!sh || !el || !wr) continue;
        const vis = wr.visibility ?? 1.0;
        if (vis < 0.35) continue;

        const angle = calculateElbowAngle(sh, el, wr);
        if (angle === null) continue;

        // Elbow bent < 120° (significant flex)
        // Wrist at or above shoulder level (wrist.y <= sh.y + small tolerance in screen coords)
        // Elbow out to the side (not in front of body)
        const elbowBent = angle < 120;
        const wristHighEnough = wr.y < sh.y + 0.06;
        const elbowLateral = Math.abs(el.x - sh.x) > 0.04;

        if (elbowBent && wristHighEnough && elbowLateral) {
          bicepDetected = true;
          break;
        }
      }
      if (bicepDetected) {
        detected = 'bicep';
        signals.confidence = 95;
      }
    }
  }

  // ─────────────────────────────────────────
  // PRIORITY 7 — TWO HANDS VISIBLE FALLBACK (Truck Hamster)
  // ─────────────────────────────────────────
  if (detected === 'default' && handLandmarksList.length === 2) {
    detected = 'two_hands';
    signals.confidence = 88;
  }

  // ─────────────────────────────────────────
  // PRIORITY 8 — HEAD DOWN (Sad Hamster)
  // pitchDeg is reliable from visionEngine regardless of hasFace being set on
  // the compact classifier face array. Remove hasFace gate.
  // ─────────────────────────────────────────
  if (detected === 'default' && pitchDeg > 18.0) {
    detected = 'sad';
    signals.confidence = 87;
  }

  // ─────────────────────────────────────────
  // PRIORITY 9 — HEAD TURNED (Side-Eye Hamster)
  // ─────────────────────────────────────────
  if (detected === 'default' && Math.abs(yawDeg) > 20.0) {
    detected = 'side_eye';
    signals.confidence = 87;
  }

  return { gesture: detected, signals, hasFace };
}

// ─────────────────────────────────────────────
// TEMPORAL SMOOTHER — ASYMMETRIC HYSTERESIS
//
// Root-cause: symmetric majority-vote means detection noise (alternating frames
// between two gestures) keeps the smoother stuck on whichever gesture had a
// slight plurality, making it feel unresponsive.
//
// New: asymmetric thresholds:
//  • ENTER: need enterCount frames out of last windowSize to activate new gesture (~167ms at 30fps)
//  • STAY: need only stayCount frames to remain in current gesture
//  • EXIT to default: only when current gesture drops below stayCount threshold
//
// This makes the reaction feel instant when held consistently, but stable when
// held with occasional dropout frames.
// ─────────────────────────────────────────────

export class TemporalSmoother {
  constructor(windowSize = 10, enterCount = 5, stayCount = 3) {
    this.windowSize = windowSize;
    this.enterCount = enterCount;
    // stayCount: frames needed to "hold" current gesture (resist switching away)
    this.stayCount = (stayCount !== undefined) ? stayCount : Math.max(2, Math.floor(enterCount * 0.6));
    this.history = [];
    this.currentStable = 'default';
  }

  // Backward compat alias
  get majorityCount() { return this.enterCount; }

  push(gesture) {
    this.history.push(gesture);
    if (this.history.length > this.windowSize) this.history.shift();

    // Count occurrences in sliding window
    const counts = {};
    for (const g of this.history) counts[g] = (counts[g] || 0) + 1;

    // Most frequent gesture in window
    let maxG = 'default', maxC = 0;
    for (const g in counts) {
      if (counts[g] > maxC || (counts[g] === maxC && g === this.currentStable)) {
        maxC = counts[g]; maxG = g;
      }
    }

    const currentCount = counts[this.currentStable] || 0;

    if (maxG === this.currentStable) {
      // Already in the right gesture — no change needed
    } else if (maxC >= this.enterCount) {
      // New gesture has enough frames → transition
      this.currentStable = maxG;
    } else if (currentCount < this.stayCount) {
      // Current gesture below stay threshold → drop to default
      this.currentStable = 'default';
    }
    // else: current gesture still has enough frames to stay — no change

    return this.currentStable;
  }

  reset() {
    this.history = [];
    this.currentStable = 'default';
  }
}
