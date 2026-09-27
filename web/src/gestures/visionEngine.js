import { FilesetResolver, HandLandmarker, FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { classifyGesture, TemporalSmoother } from "./classifier";

export class HamsterVisionEngine {
  constructor() {
    this.handLandmarker = null;
    this.faceLandmarker = null;
    this.poseLandmarker = null;
    this.isReady = false;
    this.initError = null;
    this.smoother = new TemporalSmoother(12, 6);
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

  // Calculate Head Yaw and Pitch from 3D Face landmarks
  calculateHeadAngles(faceLandmarks) {
    if (!faceLandmarks || faceLandmarks.length < 468) {
      return { yawDeg: 0, pitchDeg: 0 };
    }
    const noseTip = faceLandmarks[4];
    const leftCheek = faceLandmarks[234];
    const rightCheek = faceLandmarks[454];
    const forehead = faceLandmarks[10];
    const chin = faceLandmarks[152];

    let yawDeg = 0;
    if (noseTip && leftCheek && rightCheek) {
      const faceWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.001;
      const noseRatio = (noseTip.x - leftCheek.x) / faceWidth;
      // Centered is ~0.5
      yawDeg = (noseRatio - 0.5) * 80;
    }

    let pitchDeg = 0;
    if (noseTip && forehead && chin) {
      const faceHeight = Math.abs(chin.y - forehead.y) || 0.001;
      const noseYRatio = (noseTip.y - forehead.y) / faceHeight;
      // Centered is ~0.58; when looking down, nose tip drops towards chin
      pitchDeg = (noseYRatio - 0.58) * 85;
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
    } catch (err) {
      // Frame drop or timestamp error
      return null;
    }

    const handLandmarksList = handResults?.landmarks || [];
    const faceLandmarks = faceResults?.faceLandmarks?.[0] || null;
    const faceCount = faceResults?.faceLandmarks?.length || 0;
    const poseLandmarks = poseResults?.landmarks?.[0] || null;

    const { yawDeg, pitchDeg } = this.calculateHeadAngles(faceLandmarks);

    // Classify raw instantaneous gesture
    const rawResult = classifyGesture({
      handLandmarksList,
      faceLandmarks,
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
