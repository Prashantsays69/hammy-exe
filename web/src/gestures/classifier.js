// In-browser Geometric Hamster Gesture Classifier
// Implements robust, rotation-invariant, distance-normalized detection
// across all 15 supported hamster reactions.

// Helper: 2D Euclidean distance
export function dist2D(p1, p2) {
  if (!p1 || !p2) return 999;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

// Helper: Center coordinates of landmarks
export function landmarksCenter(landmarks) {
  if (!landmarks || landmarks.length === 0) return { x: 0.5, y: 0.5 };
  let sumX = 0;
  let sumY = 0;
  for (const p of landmarks) {
    sumX += p.x;
    sumY += p.y;
  }
  return { x: sumX / landmarks.length, y: sumY / landmarks.length };
}

// Palm Scale: Distance between wrist (0) and middle knuckle MCP (9)
export function getPalmScale(landmarks) {
  if (!landmarks || landmarks.length < 21) return 0.1;
  return dist2D(landmarks[0], landmarks[9]) || 0.1;
}

// Check 4 non-thumb fingers extension [index, middle, ring, pinky]
// Rotation-invariant Euclidean distance check:
// A finger is extended when the tip is significantly farther from the wrist
// than the knuckle (MCP) and PIP, and not curled into the palm.
const FINGER_SPECS = [
  { tip: 8, pip: 6, mcp: 5 },   // index
  { tip: 12, pip: 10, mcp: 9 }, // middle
  { tip: 16, pip: 14, mcp: 13 },// ring
  { tip: 20, pip: 18, mcp: 17 } // pinky
];

export function getFingersExtension(landmarks) {
  if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0];
  const wrist = landmarks[0];
  const scale = getPalmScale(landmarks);

  return FINGER_SPECS.map(({ tip, pip, mcp }) => {
    const dWristTip = dist2D(wrist, landmarks[tip]);
    const dWristPip = dist2D(wrist, landmarks[pip]);
    const dWristMcp = dist2D(wrist, landmarks[mcp]);
    const dTipMcp = dist2D(landmarks[tip], landmarks[mcp]);

    // Extended if tip is farther from wrist than PIP/MCP and tip is pushed out away from palm
    const isExtendedFromWrist = dWristTip > dWristPip * 1.05 && dWristTip > dWristMcp * 1.15;
    const isUncurled = dTipMcp > scale * 0.60;

    return (isExtendedFromWrist && isUncurled) ? 1 : 0;
  });
}

// Check if thumb is extended away from palm (rotation invariant)
export function isThumbExtended(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const scale = getPalmScale(landmarks);
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const pinkyMcp = landmarks[17];

  const dThumbPinky = dist2D(thumbTip, pinkyMcp);
  const dMcpPinky = dist2D(thumbMcp, pinkyMcp);
  const dThumbWrist = dist2D(thumbTip, wrist);
  const dThumbMcp = dist2D(thumbTip, thumbMcp);

  // Extended if tip is spread away from pinky knuckle or thumb base is extended far from wrist
  return (dThumbPinky > dMcpPinky * 1.08 || dThumbMcp > scale * 0.55) && dThumbWrist > scale * 0.55;
}

// Determine if extended thumb is pointing vertically DOWN (Thumbs Down)
export function isThumbDown(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const scale = getPalmScale(landmarks);
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const indexMcp = landmarks[5];

  // In camera space, Y increases DOWNWARDS (+y is lower).
  // Thumb points downward if thumbTip.y is significantly greater than thumbMcp.y
  // and lower than (or equal to) the index knuckle or wrist.
  const thumbDy = (thumbTip.y - thumbMcp.y) / scale;
  const isLowerThanMcp = thumbTip.y > thumbMcp.y + scale * 0.12;
  const isLowerThanWrist = thumbTip.y > wrist.y - scale * 0.15;
  const isLowerThanKnuckles = thumbTip.y > indexMcp.y - scale * 0.10;

  return thumbDy > 0.15 && isLowerThanMcp && (isLowerThanWrist || isLowerThanKnuckles);
}

// Determine if extended thumb is pointing vertically UP (Thumbs Up)
export function isThumbUp(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const scale = getPalmScale(landmarks);
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const indexMcp = landmarks[5];

  // In camera space, Y decreases UPWARDS (-y is higher).
  // Thumb points upward if thumbTip.y is significantly smaller than thumbMcp.y, wrist.y, and indexMcp.y
  const thumbDy = (thumbTip.y - thumbMcp.y) / scale;
  const isHigherThanMcp = thumbTip.y < thumbMcp.y - scale * 0.12;
  const isHigherThanWrist = thumbTip.y < wrist.y;
  const isHigherThanKnuckles = thumbTip.y < indexMcp.y;

  return thumbDy < -0.15 && isHigherThanMcp && (isHigherThanWrist || isHigherThanKnuckles);
}

// Classify hand shape: "fist", "thumbs_up", "thumbs_down", "pointer", "open", "other"
export function classifyHandShape(fingers, landmarks) {
  if (!landmarks || landmarks.length < 21) return "other";
  const sumFingers = fingers.reduce((a, b) => a + b, 0);

  // 1. Check for single finger pointer (Index extended, others curled)
  if (fingers[0] === 1 && fingers[1] === 0 && fingers[2] === 0 && fingers[3] === 0) {
    return "pointer";
  }

  // 2. Check for curled fingers (Fist, Thumbs Up, Thumbs Down)
  // Allow at most 1 slightly loose finger for natural hand poses
  if (sumFingers <= 1) {
    const thumbExt = isThumbExtended(landmarks);
    if (thumbExt) {
      if (isThumbDown(landmarks)) return "thumbs_down";
      if (isThumbUp(landmarks)) return "thumbs_up";
    }
    // If thumb is not distinctly up or down, or thumb is tucked in
    return "fist";
  }

  // 3. Open palm (3 or 4 fingers extended)
  if (sumFingers >= 3) {
    return "open";
  }

  return "other";
}

// Pinch detector: thumb tip (4) and index tip (8) close together,
// distinguished from a fist by verifying thumb and index tips are pinched
// while index finger is NOT curled into a fist.
export function detectPinch(landmarks) {
  if (!landmarks || landmarks.length < 21) return { isPinch: false, ratio: 999 };
  const scale = getPalmScale(landmarks);
  const dThumbIndex = dist2D(landmarks[4], landmarks[8]);
  const dThumbMiddle = dist2D(landmarks[4], landmarks[12]);
  const ratio = dThumbIndex / scale;

  // Curled index tip check: in a fist, index tip is near palm base (5)
  const dIndexTipMcp = dist2D(landmarks[8], landmarks[5]);
  const isIndexNotTuckedFist = dIndexTipMcp > scale * 0.50;

  // True pinch: index tip and thumb tip touch, and are closer to each other than thumb to middle tip
  const isPinch = ratio < 0.45 && dThumbIndex < dThumbMiddle * 0.80 && isIndexNotTuckedFist;
  return { isPinch, ratio };
}

// Calculate angle at elbow (deg)
export function calculateElbowAngle(sh, el, wr) {
  if (!sh || !el || !wr) return null;
  const v1 = { x: sh.x - el.x, y: sh.y - el.y };
  const v2 = { x: wr.x - el.x, y: wr.y - el.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return null;
  let cosAngle = dot / (mag1 * mag2);
  cosAngle = Math.max(-1.0, Math.min(1.0, cosAngle));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

// 9-Stage Priority Classifier
export function classifyGesture({
  handLandmarksList = [],
  faceLandmarks = null,
  poseLandmarks = null,
  yawDeg = 0,
  pitchDeg = 0,
}) {
  let detected = "default";
  let signals = {
    handsCount: handLandmarksList.length,
    fingers: [0, 0, 0, 0],
    isPinch: false,
    pinchRatio: 0,
    faceSignal: 0,
    yawDeg,
    pitchDeg,
    confidence: 85,
  };

  // Derive head/face center and mouth point
  let headCenter = { x: 0.5, y: 0.38 };
  let mouthPoint = { x: 0.5, y: 0.48 };
  let hasFace = false;

  if (faceLandmarks && faceLandmarks.length >= 20) {
    hasFace = true;
    headCenter = landmarksCenter(faceLandmarks);
    // Face landmark 13 is inner mouth center
    if (faceLandmarks[13]) {
      mouthPoint = { x: faceLandmarks[13].x, y: faceLandmarks[13].y };
    } else {
      mouthPoint = { x: headCenter.x, y: headCenter.y + 0.10 };
    }
    signals.faceSignal = 0.35;
  }

  // =================================================================
  // PRIORITY 1: Pinch gesture near eyes/face (Glasses / Discord Mod)
  // Only checked for single hand or distinct pinch near eye level
  // =================================================================
  if (hasFace && handLandmarksList.length === 1) {
    const hand = handLandmarksList[0];
    const { isPinch, ratio } = detectPinch(hand);
    signals.pinchRatio = ratio;
    if (isPinch) {
      signals.isPinch = true;
      const handC = landmarksCenter(hand);
      const faceDist = dist2D(handC, headCenter);
      // Specifically near eye or cheek level (not below mouth)
      if (faceDist < 0.28 && handC.y < mouthPoint.y) {
        detected = "glasses";
        signals.confidence = 96;
      }
    }
  }

  // =================================================================
  // PRIORITY 2: Fist Beside Head (Lollipop) / Thumbs Up / Thumbs Down
  // =================================================================
  if (detected === "default") {
    // Check fist beside head (Lollipop Joy! 🍭)
    // MUST be a fist, and MUST be beside head/ear level
    if (hasFace) {
      for (const hand of handLandmarksList) {
        const fingers = getFingersExtension(hand);
        signals.fingers = fingers;
        const shape = classifyHandShape(fingers, hand);
        const handC = landmarksCenter(hand);

        if (shape === "fist") {
          const dy = Math.abs(handC.y - headCenter.y);
          const dx = Math.abs(handC.x - headCenter.x);
          // Fist is beside the head/ear
          if (dy < 0.18 && dx > 0.08 && dx < 0.36 && handC.y < headCenter.y + 0.06) {
            detected = "fist_by_head";
            signals.confidence = 97;
            break;
          }
        }
      }
    }

    // If not beside head, check Thumbs Down and Thumbs Up away from face
    if (detected === "default") {
      for (const hand of handLandmarksList) {
        const fingers = getFingersExtension(hand);
        signals.fingers = fingers;
        const shape = classifyHandShape(fingers, hand);

        if (shape === "thumbs_down") {
          detected = "thumbs_down";
          signals.confidence = 96;
          break;
        } else if (shape === "thumbs_up") {
          detected = "thumbs_up";
          signals.confidence = 96;
          break;
        }
      }
    }
  }

  // =================================================================
  // PRIORITY 3: Pointer Gestures (Finger Near Mouth -> Shh, Finger Up -> Nerd)
  // =================================================================
  if (detected === "default") {
    // Check Shh (finger near mouth)
    if (hasFace) {
      for (const hand of handLandmarksList) {
        const fingers = getFingersExtension(hand);
        if (classifyHandShape(fingers, hand) === "pointer") {
          const fingertip = hand[8];
          const mDist = dist2D(fingertip, mouthPoint);
          if (mDist < 0.16) {
            detected = "finger_mouth";
            signals.confidence = 95;
            break;
          }
        }
      }
    }

    // Check Nerd (index finger pointing straight up away from mouth)
    if (detected === "default") {
      for (const hand of handLandmarksList) {
        const fingers = getFingersExtension(hand);
        if (classifyHandShape(fingers, hand) === "pointer") {
          const tip = hand[8];
          const pip = hand[6];
          const scale = getPalmScale(hand);
          // Finger pointing up in frame (-y is up)
          if (tip.y < pip.y - scale * 0.15) {
            detected = "nerd";
            signals.confidence = 93;
            break;
          }
        }
      }
    }
  }

  // =================================================================
  // PRIORITY 4: Two-hand Postures (Shy, Thinking, Hug)
  // =================================================================
  if (detected === "default" && handLandmarksList.length === 2) {
    const c1 = landmarksCenter(handLandmarksList[0]);
    const c2 = landmarksCenter(handLandmarksList[1]);
    const handsDist = dist2D(c1, c2);
    const avgCenter = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };

    // Shy: One hand touching each cheek (near cheeks, face height)
    if (hasFace && handsDist > 0.12 && handsDist < 0.38) {
      const d1 = dist2D(c1, headCenter);
      const d2 = dist2D(c2, headCenter);
      const dx1 = Math.abs(c1.x - headCenter.x);
      const dx2 = Math.abs(c2.x - headCenter.x);
      const dy1 = Math.abs(c1.y - headCenter.y);
      const dy2 = Math.abs(c2.y - headCenter.y);
      if (d1 < 0.24 && d2 < 0.24 && dx1 < 0.24 && dx2 < 0.24 && dy1 < 0.18 && dy2 < 0.18) {
        detected = "shy";
        signals.confidence = 94;
      }
    }

    // Thinking: Hands clasped directly under chin / mouth
    if (detected === "default" && hasFace && handsDist < 0.18) {
      const handsToMouth = dist2D(avgCenter, mouthPoint);
      const dyToMouth = avgCenter.y - mouthPoint.y;
      // Directly under chin or touching mouth
      if (handsToMouth < 0.09 || (dyToMouth >= -0.02 && dyToMouth < 0.08 && Math.abs(avgCenter.x - mouthPoint.x) < 0.08)) {
        detected = "thinking";
        signals.confidence = 92;
      }
    }

    // Hug: Hands held together over chest below face
    if (detected === "default" && handsDist < 0.22) {
      const belowFace = avgCenter.y - headCenter.y;
      if (belowFace > 0.14) {
        detected = "hug";
        signals.confidence = 92;
      }
    }
  }

  // =================================================================
  // PRIORITY 5: Pose Gestures (Crossed Arms / Bicep)
  // =================================================================
  if (detected === "default" && poseLandmarks && poseLandmarks.length >= 25) {
    const lWrist = poseLandmarks[15];
    const rWrist = poseLandmarks[16];
    const lSh = poseLandmarks[11];
    const rSh = poseLandmarks[12];
    const lEl = poseLandmarks[13];
    const rEl = poseLandmarks[14];

    // Crossed arms
    if (lWrist && rWrist && lSh && rSh) {
      const lVis = lWrist.visibility ?? 1.0;
      const rVis = rWrist.visibility ?? 1.0;
      if (lVis > 0.4 && rVis > 0.4) {
        const wristsClose = dist2D(lWrist, rWrist) < 0.20;
        const chestTop = Math.min(lSh.y, rSh.y);
        const chestBottom = chestTop + 0.40;
        const avgWy = (lWrist.y + rWrist.y) / 2;
        if (wristsClose && avgWy > chestTop && avgWy < chestBottom) {
          detected = "cross_arms";
          signals.confidence = 93;
        }
      }
    }

    // Bicep Flex
    if (detected === "default") {
      let bicepDetected = false;
      for (const [sh, el, wr] of [
        [lSh, lEl, lWrist],
        [rSh, rEl, rWrist],
      ]) {
        if (sh && el && wr) {
          const wrVis = wr.visibility ?? 1.0;
          if (wrVis > 0.4) {
            const angle = calculateElbowAngle(sh, el, wr);
            const wristAbove = sh.y - wr.y; // positive = wrist above shoulder (-y is up)
            const elbowOut = Math.abs(el.x - sh.x);
            if (angle !== null && angle < 110 && wristAbove > 0.04 && elbowOut > 0.05) {
              bicepDetected = true;
              break;
            }
          }
        }
      }
      if (bicepDetected) {
        detected = "bicep";
        signals.confidence = 95;
      }
    }
  }

  // =================================================================
  // PRIORITY 6: Two Hands Visible (Truck Hamster)
  // =================================================================
  if (detected === "default" && handLandmarksList.length === 2) {
    // Both hands visible, open or raised
    detected = "two_hands";
    signals.confidence = 90;
  }

  // =================================================================
  // PRIORITY 7: Head Tilted Downward (Sad Hamster)
  // =================================================================
  if (detected === "default" && hasFace && pitchDeg > 20.0) {
    detected = "sad";
    signals.confidence = 88;
  }

  // =================================================================
  // PRIORITY 8: Head Turned Sideways (Side-Eye Hamster)
  // =================================================================
  if (detected === "default" && hasFace && Math.abs(yawDeg) > 22.0) {
    detected = "side_eye";
    signals.confidence = 89;
  }

  return {
    gesture: detected,
    signals,
    hasFace,
  };
}

// Majority voting temporal filter
// Window size 10 frames (~300ms), 6 frames needed for consensus
export class TemporalSmoother {
  constructor(windowSize = 10, majorityCount = 6) {
    this.windowSize = windowSize;
    this.majorityCount = majorityCount;
    this.history = [];
    this.currentStable = "default";
  }

  push(gesture) {
    this.history.push(gesture);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    const counts = {};
    for (const g of this.history) {
      counts[g] = (counts[g] || 0) + 1;
    }

    let maxG = "default";
    let maxC = 0;
    for (const g in counts) {
      if (counts[g] > maxC) {
        maxC = counts[g];
        maxG = g;
      }
    }

    // Require majority consensus before switching active reaction
    if (maxC >= this.majorityCount) {
      this.currentStable = maxG;
    }
    return this.currentStable;
  }

  reset() {
    this.history = [];
    this.currentStable = "default";
  }
}
