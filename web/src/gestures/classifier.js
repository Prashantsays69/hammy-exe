// In-browser Geometric Hamster Gesture Classifier
// Implements the exact 9-stage priority matching and threshold logic

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

// Check 4 non-thumb fingers extension [index, middle, ring, pinky]
// Finger is extended if tip is higher (y is smaller) than PIP joint
const FINGER_JOINTS = [
  [8, 5],   // index
  [12, 9],  // middle
  [16, 13], // ring
  [20, 17], // pinky
];

export function getFingersExtension(landmarks) {
  if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0];
  const states = [];
  for (const [tip, pip] of FINGER_JOINTS) {
    states.push(landmarks[tip].y < landmarks[pip].y ? 1 : 0);
  }
  return states; // [index, middle, ring, pinky]
}

// Classify hand shape: "fist", "thumbs_up", "pointer", "open", "other"
export function classifyHandShape(fingers, landmarks) {
  const sumFingers = fingers.reduce((a, b) => a + b, 0);
  if (sumFingers === 0) {
    // Check if thumb is extended upward or sideways
    if (landmarks && landmarks.length >= 21) {
      const thumbTip = landmarks[4];
      const thumbMcp = landmarks[2];
      const wrist = landmarks[0];
      // If thumb tip is significantly higher or pointing away from wrist
      const thumbUp = thumbTip.y < thumbMcp.y && Math.abs(thumbTip.y - wrist.y) > 0.08;
      const thumbDown = thumbTip.y > thumbMcp.y && Math.abs(thumbTip.y - wrist.y) > 0.08;
      if (thumbUp || thumbDown) {
        return "thumbs_up";
      }
    }
    return "fist";
  }
  if (fingers[0] === 1 && fingers[1] === 0 && fingers[2] === 0 && fingers[3] === 0) {
    return "pointer";
  }
  if (sumFingers >= 3) {
    return "open";
  }
  return "other";
}

export function isThumbDown(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const wrist = landmarks[0];
  return thumbTip.y > thumbMcp.y || thumbTip.y > wrist.y;
}

// Pinch detector: thumb tip (4) and index tip (8) close together
export function detectPinch(landmarks) {
  if (!landmarks || landmarks.length < 21) return { isPinch: false, ratio: 0 };
  const dThumbIndex = dist2D(landmarks[4], landmarks[8]);
  const palmScale = dist2D(landmarks[0], landmarks[9]) || 0.1;
  const ratio = dThumbIndex / palmScale;
  const isPinch = ratio < 0.50;
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
  let headCenter = { x: 0.5, y: 0.4 };
  let mouthPoint = { x: 0.5, y: 0.48 };
  let hasFace = false;

  if (faceLandmarks && faceLandmarks.length > 20) {
    hasFace = true;
    headCenter = landmarksCenter(faceLandmarks);
    // Face landmark 13 is inner mouth center
    if (faceLandmarks[13]) {
      mouthPoint = { x: faceLandmarks[13].x, y: faceLandmarks[13].y };
    } else {
      mouthPoint = { x: headCenter.x, y: headCenter.y + 0.08 };
    }
    signals.faceSignal = 0.35;
  }

  // =================================================================
  // PRIORITY 1: Pinch gesture near face (Glasses / Discord Mod)
  // =================================================================
  for (const hand of handLandmarksList) {
    const { isPinch, ratio } = detectPinch(hand);
    signals.pinchRatio = ratio;
    if (isPinch) {
      signals.isPinch = true;
      const handC = landmarksCenter(hand);
      const faceDist = dist2D(handC, headCenter);
      if (faceDist < 0.28) {
        detected = "glasses";
        signals.confidence = 96;
        break;
      }
    }
  }

  // =================================================================
  // PRIORITY 2: Fist Beside Head (Lollipop) / Thumbs Up / Down
  // =================================================================
  if (detected === "default") {
    for (const hand of handLandmarksList) {
      const fingers = getFingersExtension(hand);
      signals.fingers = fingers;
      const shape = classifyHandShape(fingers, hand);
      const handC = landmarksCenter(hand);

      if (shape === "fist" || shape === "thumbs_up") {
        const dy = Math.abs(handC.y - headCenter.y);
        const dx = Math.abs(handC.x - headCenter.x);
        // Fist is beside the head
        if (dy < 0.16 && dx > 0.07 && dx < 0.32) {
          detected = "fist_by_head";
          signals.confidence = 97;
          break;
        }
      }
    }

    // Thumbs up / down away from face
    if (detected === "default") {
      for (const hand of handLandmarksList) {
        const fingers = getFingersExtension(hand);
        const shape = classifyHandShape(fingers, hand);
        if (shape === "thumbs_up") {
          const down = isThumbDown(hand);
          detected = down ? "thumbs_down" : "thumbs_up";
          signals.confidence = 94;
          break;
        }
      }
    }
  }

  // =================================================================
  // PRIORITY 3: Pointer Gestures (Finger Near Mouth -> Shh, Finger Up -> Nerd)
  // =================================================================
  if (detected === "default") {
    for (const hand of handLandmarksList) {
      const fingers = getFingersExtension(hand);
      if (classifyHandShape(fingers, hand) === "pointer") {
        const fingertip = hand[8];
        const mDist = dist2D(fingertip, mouthPoint);
        if (mDist < 0.14) {
          detected = "finger_mouth";
          signals.confidence = 95;
          break;
        }
      }
    }

    if (detected === "default") {
      for (const hand of handLandmarksList) {
        const fingers = getFingersExtension(hand);
        if (classifyHandShape(fingers, hand) === "pointer") {
          // Index finger is pointing straight up
          const tip = hand[8];
          const pip = hand[6];
          if (tip.y < pip.y) {
            detected = "nerd";
            signals.confidence = 92;
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

    // Shy: One hand touching each cheek (apart, face height)
    if (handsDist > 0.15) {
      const d1 = dist2D(c1, headCenter);
      const d2 = dist2D(c2, headCenter);
      const dy1 = Math.abs(c1.y - headCenter.y);
      const dy2 = Math.abs(c2.y - headCenter.y);
      if (d1 < 0.30 && d2 < 0.30 && dy1 < 0.18 && dy2 < 0.18) {
        detected = "shy";
        signals.confidence = 94;
      }
    } else if (handsDist < 0.13) {
      // Hands together: Thinking or Hug
      const handsToMouth = dist2D(avgCenter, mouthPoint);
      if (handsToMouth < 0.22) {
        detected = "thinking";
        signals.confidence = 91;
      } else {
        const belowFace = avgCenter.y - headCenter.y;
        if (belowFace > 0.18) {
          detected = "hug";
          signals.confidence = 92;
        }
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
      const wristsClose = dist2D(lWrist, rWrist) < 0.18;
      const chestTop = Math.min(lSh.y, rSh.y);
      const chestBottom = chestTop + 0.38;
      const avgWy = (lWrist.y + rWrist.y) / 2;
      if (wristsClose && avgWy > chestTop && avgWy < chestBottom) {
        detected = "cross_arms";
        signals.confidence = 93;
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
          const angle = calculateElbowAngle(sh, el, wr);
          const wristAbove = sh.y - wr.y; // positive = wrist above shoulder
          const elbowOut = Math.abs(el.x - sh.x);
          if (angle !== null && angle < 105 && wristAbove > 0.05 && elbowOut > 0.05) {
            bicepDetected = true;
            break;
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
  // PRIORITY 6: Two Hands Visible with no other match -> Truck Hamster
  // =================================================================
  if (detected === "default" && handLandmarksList.length === 2) {
    detected = "two_hands";
    signals.confidence = 90;
  }

  // =================================================================
  // PRIORITY 7: Head Tilted Downward -> Sad Hamster
  // =================================================================
  if (detected === "default" && pitchDeg > 15.0) {
    detected = "sad";
    signals.confidence = 88;
  }

  // =================================================================
  // PRIORITY 8: Head Turned Sideways -> Side-Eye Hamster
  // =================================================================
  if (detected === "default" && Math.abs(yawDeg) > 18.0) {
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
export class TemporalSmoother {
  constructor(windowSize = 12, majorityCount = 7) {
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

    if (maxC >= this.majorityCount) {
      this.currentStable = maxG;
    }
    return this.currentStable;
  }
}
