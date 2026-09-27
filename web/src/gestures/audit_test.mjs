import {
  dist2D,
  landmarksCenter,
  getPalmScale,
  getFingersExtension,
  isThumbExtended,
  isThumbDown,
  isThumbUp,
  classifyHandShape,
  detectPinch,
  classifyGesture,
  TemporalSmoother,
} from "./classifier.js";

function pt(x, y, z = 0, visibility = 1.0) {
  return { x, y, z, visibility };
}

// Helper: build a 21-landmark hand given basic geometry
function buildHand({
  wrist = { x: 0.5, y: 0.7 },
  scale = 0.12,
  thumbMode = "tucked", // "up", "down", "tucked", "pinch_index"
  fingersCurled = true, // true for fist/thumbs up/down
  indexExtended = false, // true for pointer
  fingersOpen = false,  // true for open hand
}) {
  const lms = new Array(21);
  lms[0] = pt(wrist.x, wrist.y);

  // Knuckles (MCPs)
  lms[1] = pt(wrist.x - scale * 0.25, wrist.y - scale * 0.35); // thumb CMC
  lms[2] = pt(wrist.x - scale * 0.40, wrist.y - scale * 0.55); // thumb MCP
  lms[3] = pt(wrist.x - scale * 0.50, wrist.y - scale * 0.75); // thumb IP
  lms[4] = pt(wrist.x - scale * 0.45, wrist.y - scale * 0.70); // thumb tip (default tucked)

  lms[5] = pt(wrist.x - scale * 0.30, wrist.y - scale * 0.85); // index MCP
  lms[9] = pt(wrist.x, wrist.y - scale * 1.0);                  // middle MCP
  lms[13] = pt(wrist.x + scale * 0.25, wrist.y - scale * 0.90); // ring MCP
  lms[17] = pt(wrist.x + scale * 0.45, wrist.y - scale * 0.80); // pinky MCP

  // Configure non-thumb fingers (Index 6,7,8; Middle 10,11,12; Ring 14,15,16; Pinky 18,19,20)
  const fingerConfigs = [
    { base: 5, joints: [6, 7, 8], ext: indexExtended || fingersOpen, dx: -scale * 0.30 },
    { base: 9, joints: [10, 11, 12], ext: fingersOpen, dx: 0 },
    { base: 13, joints: [14, 15, 16], ext: fingersOpen, dx: scale * 0.25 },
    { base: 17, joints: [18, 19, 20], ext: fingersOpen, dx: scale * 0.45 },
  ];

  for (const { base, joints, ext, dx } of fingerConfigs) {
    const mcp = lms[base];
    if (ext) {
      // Extended straight up
      lms[joints[0]] = pt(wrist.x + dx, mcp.y - scale * 0.30); // PIP
      lms[joints[1]] = pt(wrist.x + dx, mcp.y - scale * 0.55); // DIP
      lms[joints[2]] = pt(wrist.x + dx, mcp.y - scale * 0.85); // Tip
    } else {
      // Curled into palm
      lms[joints[0]] = pt(wrist.x + dx, mcp.y - scale * 0.25); // PIP
      lms[joints[1]] = pt(wrist.x + dx, mcp.y - scale * 0.15); // DIP (folds back)
      lms[joints[2]] = pt(wrist.x + dx, mcp.y + scale * 0.05); // Tip (curled against palm)
    }
  }

  // Configure Thumb
  if (thumbMode === "up") {
    // Thumb points vertically UP
    lms[2] = pt(wrist.x - scale * 0.40, wrist.y - scale * 0.50);
    lms[3] = pt(wrist.x - scale * 0.45, wrist.y - scale * 0.80);
    lms[4] = pt(wrist.x - scale * 0.45, wrist.y - scale * 1.15); // tip is high up
  } else if (thumbMode === "down") {
    // Thumb points vertically DOWN
    lms[2] = pt(wrist.x - scale * 0.40, wrist.y - scale * 0.40);
    lms[3] = pt(wrist.x - scale * 0.45, wrist.y - scale * 0.10);
    lms[4] = pt(wrist.x - scale * 0.45, wrist.y + scale * 0.35); // tip is lower down
  } else if (thumbMode === "pinch_index") {
    // Thumb tip meets index tip
    const idxTip = lms[8];
    lms[4] = pt(idxTip.x - scale * 0.05, idxTip.y);
  } else {
    // Tucked fist
    lms[4] = pt(lms[5].x + scale * 0.1, lms[5].y); // against index knuckle
  }

  return lms;
}

function buildFace(cx = 0.5, cy = 0.38) {
  const lms = new Array(468);
  for (let i = 0; i < 468; i++) lms[i] = pt(cx, cy);
  lms[4] = pt(cx, cy);                  // nose tip
  lms[10] = pt(cx, cy - 0.10);          // forehead
  lms[13] = pt(cx, cy + 0.10);          // inner mouth
  lms[152] = pt(cx, cy + 0.14);         // chin
  lms[234] = pt(cx - 0.10, cy);         // left cheek
  lms[454] = pt(cx + 0.10, cy);         // right cheek
  return lms;
}

function runAudit() {
  console.log("=================================================");
  console.log(" HAMMY.EXE FULL GESTURE DETECTION AUDIT SUITE");
  console.log("=================================================\n");

  const face = buildFace(0.5, 0.38);
  let passed = 0;
  let total = 0;

  function assert(actual, expected, name) {
    total++;
    if (actual === expected) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} -> Expected '${expected}', got '${actual}'`);
    }
  }

  // 1. NEUTRAL / DEFAULT (Poker-Face)
  const g1 = classifyGesture({ handLandmarksList: [], faceLandmarks: face });
  assert(g1.gesture, "default", "1. Neutral / Poker-Face (no hands, face upright)");

  // 2. THUMBS UP (Happy Hammy)
  const handThumbsUp = buildHand({ thumbMode: "up", wrist: { x: 0.25, y: 0.7 } });
  const g2 = classifyGesture({ handLandmarksList: [handThumbsUp], faceLandmarks: face });
  assert(g2.gesture, "thumbs_up", "2. Thumbs Up -> Happy Hammy 👍");

  // 3. THUMBS DOWN (Disappointed Hammy)
  const handThumbsDown = buildHand({ thumbMode: "down", wrist: { x: 0.25, y: 0.5 } });
  const g3 = classifyGesture({ handLandmarksList: [handThumbsDown], faceLandmarks: face });
  assert(g3.gesture, "thumbs_down", "3. Thumbs Down -> Disappointed Hammy 👎");

  // 4. FIST BESIDE HEAD (Lollipop Joy)
  const handFistNearEar = buildHand({ thumbMode: "tucked", wrist: { x: 0.70, y: 0.40 } });
  const g4 = classifyGesture({ handLandmarksList: [handFistNearEar], faceLandmarks: face });
  assert(g4.gesture, "fist_by_head", "4. Fist Beside Head -> Lollipop Joy! 🍭");

  // 5. PINCH NEAR EYE (Discord Mod Glasses)
  const handPinchNearEye = buildHand({
    thumbMode: "pinch_index",
    indexExtended: true,
    wrist: { x: 0.48, y: 0.48 }
  });
  const g5 = classifyGesture({ handLandmarksList: [handPinchNearEye], faceLandmarks: face });
  assert(g5.gesture, "glasses", "5. Pinch Near Face -> Discord Mod Glasses 🤏");

  // 6. FINGER NEAR MOUTH (Shh Hammy)
  const handShh = buildHand({
    thumbMode: "tucked",
    indexExtended: true,
    wrist: { x: 0.50, y: 0.65 }
  });
  handShh[8] = pt(0.50, 0.48); // index tip exactly at mouth
  const g6 = classifyGesture({ handLandmarksList: [handShh], faceLandmarks: face });
  assert(g6.gesture, "finger_mouth", "6. Finger Near Mouth -> Shh Hammy 🤫");

  // 7. NERD (Index finger pointing straight up)
  const handNerd = buildHand({
    thumbMode: "tucked",
    indexExtended: true,
    wrist: { x: 0.25, y: 0.60 }
  });
  const g7 = classifyGesture({ handLandmarksList: [handNerd], faceLandmarks: face });
  assert(g7.gesture, "nerd", "7. Single Finger Up -> Nerd Hamster ☝️");

  // 8. SHY (Two hands on cheeks)
  const shyHandL = buildHand({ wrist: { x: 0.38, y: 0.44 }, fingersOpen: true });
  const shyHandR = buildHand({ wrist: { x: 0.62, y: 0.44 }, fingersOpen: true });
  const g8 = classifyGesture({ handLandmarksList: [shyHandL, shyHandR], faceLandmarks: face });
  assert(g8.gesture, "shy", "8. Hands On Cheeks -> Shy Hammy 🥺");

  // 9. THINKING (Two hands clasped under chin)
  const thinkHandL = buildHand({ wrist: { x: 0.46, y: 0.54 } });
  const thinkHandR = buildHand({ wrist: { x: 0.54, y: 0.54 } });
  const g9 = classifyGesture({ handLandmarksList: [thinkHandL, thinkHandR], faceLandmarks: face });
  assert(g9.gesture, "thinking", "9. Hands Clasped Under Chin -> Pondering Hammy 🤔");

  // 10. HUG (Two hands held together over chest)
  const hugHandL = buildHand({ wrist: { x: 0.45, y: 0.70 } });
  const hugHandR = buildHand({ wrist: { x: 0.55, y: 0.70 } });
  const g10 = classifyGesture({ handLandmarksList: [hugHandL, hugHandR], faceLandmarks: face });
  assert(g10.gesture, "hug", "10. Hands Held At Chest -> Hug Hammy 🤗");

  // 11. TWO HANDS OPEN (Truck Hammy)
  const openHandL = buildHand({ wrist: { x: 0.20, y: 0.55 }, fingersOpen: true });
  const openHandR = buildHand({ wrist: { x: 0.80, y: 0.55 }, fingersOpen: true });
  const g11 = classifyGesture({ handLandmarksList: [openHandL, openHandR], faceLandmarks: face });
  assert(g11.gesture, "two_hands", "11. Two Hands Raised -> Truck Hammy 🚚");

  // 12. CROSSED ARMS (Nope Hammy)
  const poseCross = new Array(33);
  for (let i = 0; i < 33; i++) poseCross[i] = pt(0.5, 0.5);
  poseCross[11] = pt(0.35, 0.40); // left shoulder
  poseCross[12] = pt(0.65, 0.40); // right shoulder
  poseCross[15] = pt(0.52, 0.52); // left wrist
  poseCross[16] = pt(0.48, 0.52); // right wrist (wrists crossed at chest)
  const g12 = classifyGesture({ poseLandmarks: poseCross, faceLandmarks: face });
  assert(g12.gesture, "cross_arms", "12. Crossed Arms -> Nope Hammy 🙅");

  // 13. BICEP (Swole Hammy)
  const poseBicep = new Array(33);
  for (let i = 0; i < 33; i++) poseBicep[i] = pt(0.5, 0.5);
  poseBicep[11] = pt(0.40, 0.50); // left shoulder
  poseBicep[13] = pt(0.20, 0.50); // left elbow (out to side)
  poseBicep[15] = pt(0.25, 0.32); // left wrist (up above shoulder, bent 70 deg)
  const g13 = classifyGesture({ poseLandmarks: poseBicep, faceLandmarks: face });
  assert(g13.gesture, "bicep", "13. Bicep Flex -> Swole Hammy 💪");

  // 14. SAD (Head Down)
  const g14 = classifyGesture({ faceLandmarks: face, pitchDeg: 26.0 });
  assert(g14.gesture, "sad", "14. Head Down Tilt -> Sad Hammy 🙇");

  // 15. SIDE-EYE (Head Turn)
  const g15 = classifyGesture({ faceLandmarks: face, yawDeg: 28.0 });
  assert(g15.gesture, "side_eye", "15. Head Side Turn -> Side-Eye Hamster 👀");

  // 16. TEMPORAL SMOOTHER TESTS
  console.log("\n  Testing Temporal Smoother Stability...");
  const smoother = new TemporalSmoother(10, 6);
  // Feed 4 frames of thumbs_down (insufficient)
  for (let i = 0; i < 4; i++) smoother.push("thumbs_down");
  assert(smoother.currentStable, "default", "16a. Smoother rejects < 6 transient frames");
  // Feed 2 more frames of thumbs_down (6 total => consensus)
  smoother.push("thumbs_down");
  const stable = smoother.push("thumbs_down");
  assert(stable, "thumbs_down", "16b. Smoother transitions upon 6 frame consensus");
  // Single glitch frame
  const glitch = smoother.push("default");
  assert(glitch, "thumbs_down", "16c. Smoother ignores single frame glitch");

  console.log(`\n=================================================`);
  console.log(` AUDIT RESULTS: ${passed} / ${total} TESTS PASSED!`);
  console.log(`=================================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAudit();
