import { FilesetResolver, HandLandmarker, FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { classifyGesture, TemporalSmoother } from "./classifier";

export class HamsterVisionEngine {
  constructor() {
    this.handLandmarker = null;
    this.faceLandmarker = null;
    this.poseLandmarker = null;
    this.isReady = false;
    this.initError = null;
    this.smoother = new TemporalSmoother(10, 6);
    this.lastFrameTime = 0;
    this.fps = 0;
  }

  async init(statusCallback = () => {}) {
    try {
      statusCallback("Loading vision models...");
      
      // Attempt local wasm first, fallback to CDN if needed
      let vision = null;
      try {
        vision = await FilesetResolver.forVisionTasks("/wasm");
      } catch (err) {
        console.warn("Local wasm failed, trying CDN wasm...", err);
        vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
      }

      statusCallback("Initializing Hand Landmarker...");
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      statusCallback("Initializing Face Landmarker...");
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 2,
        minFaceDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFacialTransformationMatrixes: true,
      });

      statusCallback("Initializing Pose Landmarker...");
      try {
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/pose_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
      } catch (e) {
        console.warn("Pose landmarker init warning (non-fatal):", e);
      }

      this.isReady = true;
      statusCallback("Vision engine ready!");
      return true;
    } catch (err) {
      console.error("Failed to initialize vision engine:", err);
      this.initError = err.message || "Failed to load MediaPipe models";
      statusCallback("Error loading models: " + this.initError);
      return false;
    }
  }

  // Calculate Head Yaw and Pitch from 3D Face landmarks & transformation matrix
  calculateHeadAngles(faceLandmarks, faceMatrix) {
    let yawDeg = 0;
    let pitchDeg = 0;

    // 1. If facial transformation matrix is available, extract 3D rotation angles
    if (faceMatrix) {
      try {
        const d = faceMatrix.data || faceMatrix;
        let r02 = 0;
        let r12 = 0;
        if (Array.isArray(faceMatrix) && Array.isArray(faceMatrix[0])) {
          r02 = faceMatrix[0][2];
          r12 = faceMatrix[1][2];
        } else if (d && d.length >= 16) {
          // Column-major: row 0 col 2 = index 8, row 1 col 2 = index 9
          r02 = d[8] !== undefined ? d[8] : d[2];
          r12 = d[9] !== undefined ? d[9] : d[6];
        }
        if (r02 !== 0 || r12 !== 0) {
          yawDeg = Math.asin(Math.max(-1, Math.min(1, r02))) * (180 / Math.PI);
          pitchDeg = Math.asin(Math.max(-1, Math.min(1, -r12))) * (180 / Math.PI);
          return { yawDeg, pitchDeg };
        }
      } catch {
        // Fall back to landmark-based 3D calculation
      }
    }

    if (!faceLandmarks || faceLandmarks.length < 14) {
      return { yawDeg: 0, pitchDeg: 0 };
    }

    const noseTip = faceLandmarks[4];
    const leftCheek = faceLandmarks[234] || faceLandmarks[1];
    const rightCheek = faceLandmarks[454] || faceLandmarks[2];
    const forehead = faceLandmarks[10];
    const chin = faceLandmarks[152] || faceLandmarks[13];

    // YAW: Horizontal offset of nose relative to cheek midpoint (decoupled from pitch)
    if (noseTip && leftCheek && rightCheek) {
      const midCheekX = (leftCheek.x + rightCheek.x) / 2;
      const faceWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.001;
      const noseOffsetRatio = (noseTip.x - midCheekX) / faceWidth;
      yawDeg = noseOffsetRatio * 90;
    }

    // PITCH: Depth differential between chin and forehead + 2D perspective ratio
    if (noseTip && forehead && chin) {
      const faceHeight = Math.abs(chin.y - forehead.y) || 0.001;
      const noseYRatio = (noseTip.y - forehead.y) / faceHeight;
      // 2D perspective component: when looking down, nose tip drops towards chin
      const pitch2D = (noseYRatio - 0.56) * 90;

      // 3D depth component (if z coordinates present)
      let pitch3D = null;
      if (typeof chin.z === "number" && typeof forehead.z === "number" && (chin.z !== 0 || forehead.z !== 0)) {
        const dz = chin.z - forehead.z;
        pitch3D = Math.atan2(dz * 1.5, faceHeight) * (180 / Math.PI);
      }

      pitchDeg = pitch3D !== null ? (pitch3D * 0.7 + pitch2D * 0.3) : pitch2D;
    }

    return { yawDeg, pitchDeg };
  }

  // Process a video frame
  processVideoFrame(videoElement, timestamp) {
    if (!this.isReady || !videoElement || videoElement.readyState < 2) {
      return null;
    }

    // Calculate real-time FPS
    if (this.lastFrameTime) {
      const delta = (timestamp - this.lastFrameTime) / 1000;
      if (delta > 0) {
        this.fps = Math.round(1 / delta);
      }
    }
    this.lastFrameTime = timestamp;

    let handResults = null;
    let faceResults = null;
    let poseResults = null;

    try {
      if (this.handLandmarker) {
        handResults = this.handLandmarker.detectForVideo(videoElement, timestamp);
      }
      if (this.faceLandmarker) {
        faceResults = this.faceLandmarker.detectForVideo(videoElement, timestamp);
      }
      if (this.poseLandmarker) {
        poseResults = this.poseLandmarker.detectForVideo(videoElement, timestamp);
      }
    } catch {
      // Frame drop or timestamp error
      return null;
    }

    const handLandmarksList = handResults?.landmarks || [];
    const faceLandmarks = faceResults?.faceLandmarks?.[0] || null;
    const faceMatrix = faceResults?.facialTransformationMatrixes?.[0] || null;
    const faceCount = faceResults?.faceLandmarks?.length || 0;
    const poseLandmarks = poseResults?.landmarks?.[0] || null;

    const { yawDeg, pitchDeg } = this.calculateHeadAngles(faceLandmarks, faceMatrix);

    // Build a compact face landmark array using only eye-level and nose landmarks.
    // The full 478-point FaceLandmarker result includes jaw, chin, and neck which
    // pull landmarksCenter() ~10-12% down the frame compared to the true eye/nose
    // center. That biased headCenter caused fist_by_head (dy check), shy, and
    // thinking distance checks to miss gestures performed at the correct position.
    //
    // Index 13 MUST be the mouth landmark (upper inner lip) — the classifier
    // reads faceLandmarks[13] directly for the mouth proximity checks.
    let classifierFaceLandmarks = faceLandmarks;
    if (faceLandmarks && faceLandmarks.length >= 468) {
      classifierFaceLandmarks = [
        faceLandmarks[4],   // 0  nose tip
        faceLandmarks[33],  // 1  left inner eye corner
        faceLandmarks[263], // 2  right inner eye corner
        faceLandmarks[10],  // 3  forehead
        faceLandmarks[234], // 4  left cheek
        faceLandmarks[454], // 5  right cheek
        faceLandmarks[168], // 6  nose bridge mid
        faceLandmarks[6],   // 7  nose bridge upper
        faceLandmarks[197], // 8  nose bridge lower
        faceLandmarks[195], // 9  nose lower
        faceLandmarks[5],   // 10 nose upper bridge
        faceLandmarks[4],   // 11 nose tip dup (keeps centroid stable)
        faceLandmarks[33],  // 12 left eye dup
        faceLandmarks[13],  // 13 upper inner lip ← classifier reads this index
      ];
    }

    // Classify raw instantaneous gesture
    const rawResult = classifyGesture({
      handLandmarksList,
      faceLandmarks: classifierFaceLandmarks,
      poseLandmarks,
      yawDeg,
      pitchDeg,
    });

    // Temporal majority voting
    const stableGesture = this.smoother.push(rawResult.gesture);

    return {
      rawGesture: rawResult.gesture,
      stableGesture,
      confidence: rawResult.signals.confidence,
      signals: rawResult.signals,
      hasFace: rawResult.hasFace,
      faceCount,
      handCount: handLandmarksList.length,
      handLandmarksList,
      faceLandmarks,
      poseLandmarks,
      yawDeg,
      pitchDeg,
      fps: this.fps,
    };
  }

  destroy() {
    if (this.handLandmarker) this.handLandmarker.close();
    if (this.faceLandmarker) this.faceLandmarker.close();
    if (this.poseLandmarker) this.poseLandmarker.close();
  }
}
