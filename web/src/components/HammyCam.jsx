import React, { useRef, useEffect, useState } from "react";
import { HamsterArt } from "../hamster/art";
import { REACTIONS } from "../hamster/reactions";
import { soundFX, audioManager } from "../utils/audio";
import { Camera, RefreshCw, Eye, EyeOff, Bug } from "lucide-react";

export default function HammyCam({
  activeReaction,
  detectionData,
  isCameraActive,
  setIsCameraActive,
  cameraError,
  setCameraError,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const [reactionAnimKey, setReactionAnimKey] = useState(0);

  // Trigger bounce animation whenever stable gesture changes
  useEffect(() => {
    setReactionAnimKey((prev) => prev + 1);
  }, [activeReaction?.id]);

  // Handle Starting / Stopping webcam with audio feedback
  const startCamera = async () => {
    soundFX.camStart();
    audioManager.startMusicOnInteraction();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        soundFX.camReady();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      soundFX.camError();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("bro really said NO 💀 (Camera permission denied)");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("hammy can't find a camera plugged in 😭");
      } else {
        setCameraError("Camera error: " + (err.message || "Failed to start camera"));
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    soundFX.camStop();
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
  };

  // Video loop & Canvas landmark rendering
  useEffect(() => {
    let active = true;

    const renderLoop = (time) => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && isCameraActive && video.readyState >= 2) {
        const ctx = canvas.getContext("2d");
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        // Draw webcam frame
        ctx.save();
        if (mirrorVideo) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);

        // Draw Landmarker Skeletons if enabled
        if (showSkeleton && detectionData) {
          const { handLandmarksList, faceLandmarks } = detectionData;

          // Hand landmarks (cyan glow lines, green nodes)
          if (handLandmarksList && handLandmarksList.length > 0) {
            const HAND_CONNECTIONS = [
              [0, 1], [1, 2], [2, 3], [3, 4],
              [0, 5], [5, 6], [6, 7], [7, 8],
              [5, 9], [9, 10], [10, 11], [11, 12],
              [9, 13], [13, 14], [14, 15], [15, 16],
              [13, 17], [17, 18], [18, 19], [19, 20],
              [0, 17]
            ];

            for (const hand of handLandmarksList) {
              // Lines
              ctx.lineWidth = 3;
              ctx.strokeStyle = "#38bdf8"; // bright cyan
              ctx.shadowColor = "#38bdf8";
              ctx.shadowBlur = 8;

              for (const [p1, p2] of HAND_CONNECTIONS) {
                if (hand[p1] && hand[p2]) {
                  ctx.beginPath();
                  ctx.moveTo(hand[p1].x * width, hand[p1].y * height);
                  ctx.lineTo(hand[p2].x * width, hand[p2].y * height);
                  ctx.stroke();
                }
              }

              // Nodes
              ctx.shadowBlur = 0;
              for (const pt of hand) {
                ctx.beginPath();
                ctx.arc(pt.x * width, pt.y * height, 4.5, 0, 2 * Math.PI);
                ctx.fillStyle = "#4ade80"; // neon green
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            }
          }

          // Face reticle / bounding box
          if (faceLandmarks && faceLandmarks.length > 10) {
            const nose = faceLandmarks[4];
            if (nose) {
              ctx.strokeStyle = "rgba(250, 204, 21, 0.7)";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(nose.x * width, nose.y * height, 16, 0, 2 * Math.PI);
              ctx.stroke();
            }
          }
        }

        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    if (isCameraActive) {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, mirrorVideo, showSkeleton, detectionData]);

  const currentMeta = activeReaction || REACTIONS.default;

  return (
    <div id="cam" style={{
      background: "#ffffff",
      border: "3px solid #18181b",
      borderRadius: "20px",
      boxShadow: "var(--ink-shadow)",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Window Header Bar */}
      <div style={{
        background: "var(--pastel-pink)",
        borderBottom: "3px solid #18181b",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🐹</span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: "800",
            fontSize: "16px",
            letterSpacing: "0.5px"
          }}>
            HAMMY CAM
          </span>
        </div>

        {/* Live Badge & Camera Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            background: isCameraActive ? "#ef4444" : "#94a3b8",
            color: "#ffffff",
            padding: "3px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: "1.5px solid #18181b"
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#ffffff",
              display: "inline-block",
              animation: isCameraActive ? "popReaction 1s infinite" : "none"
            }} />
            <span>{isCameraActive ? "LIVE" : "STANDBY"}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Panel Stage */}
      <div className="hammy-cam-stage">
        {/* LEFT PANEL: HAMSTER REACTION PANEL */}
        <div className="hammy-reaction-panel">
          {/* Top Label */}
          <div style={{
            fontFamily: "var(--font-display)",
            fontWeight: "800",
            fontSize: "14px",
            letterSpacing: "1px",
            color: "#64748b",
            textTransform: "uppercase"
          }}>
            HAMMY SAYS:
          </div>

          {/* Hamster Artwork Container */}
          <div
            key={reactionAnimKey}
            className="animate-pop"
            style={{
              width: "100%",
              maxWidth: "260px",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "10px 0"
            }}
          >
            <HamsterArt
              type={currentMeta.id}
              style={{ width: "100%", maxHeight: "250px" }}
            />
          </div>

          {/* Bottom Reaction Title */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px"
          }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px, 2.5vw, 26px)",
              fontWeight: "900",
              color: currentMeta.color || "#18181b",
              textShadow: "1.5px 1.5px 0px #18181b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textAlign: "center"
            }}>
              <span>{currentMeta.icon}</span>
              <span>{currentMeta.name}</span>
            </div>

            <div style={{
              fontFamily: "var(--font-doodle)",
              fontSize: "14px",
              color: "#64748b",
              fontWeight: "700",
              textAlign: "center"
            }}>
              {currentMeta.instruction}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE WEBCAM PANEL */}
        <div className="hammy-webcam-panel">
          {/* Hidden Video element providing frames */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ display: "none" }}
          />

          {/* Render Canvas */}
          {isCameraActive ? (
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
            />
          ) : (
            /* Friendly Camera Offline UI */
            <div style={{
              padding: "32px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
              color: "#ffffff"
            }}>
              <div style={{ fontSize: "56px" }}>📷</div>
              <div>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "24px",
                  fontWeight: "800",
                  marginBottom: "6px"
                }}>
                  Camera is Sleeping
                </h3>
                <p style={{
                  fontFamily: "var(--font-doodle)",
                  fontSize: "17px",
                  color: "#94a3b8",
                  maxWidth: "340px"
                }}>
                  {cameraError || "Click below to wake up your camera and let Hammy judge your goofy faces!"}
                </p>
              </div>

              <button
                onClick={startCamera}
                onMouseEnter={() => soundFX.hover()}
                className="comic-btn"
                style={{
                  background: "var(--pastel-pink)",
                  color: "#18181b",
                  fontSize: "16px",
                  padding: "10px 24px"
                }}
              >
                <Camera size={18} />
                <span>Start Webcam</span>
              </button>
            </div>
          )}

          {/* Developer Debug Telemetry HUD Overlay (Top-Left of Video) */}
          {isCameraActive && showDebug && (
            <div style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              fontFamily: "var(--font-code)",
              fontSize: "11px",
              color: "#fef08a", // neon yellow
              lineHeight: 1.5,
              textShadow: "1px 1px 2px rgba(0,0,0,0.9)",
              pointerEvents: "none",
              background: "rgba(0, 0, 0, 0.65)",
              padding: "8px 12px",
              borderRadius: "8px",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(254, 240, 138, 0.4)",
              zIndex: 10,
              maxWidth: "320px"
            }}>
              <div style={{ fontWeight: "700", color: "#67e8f9", marginBottom: "2px" }}>
                HAMMY.EXE VISION DEBUG
              </div>
              <div>
                GESTURE: <span style={{ color: "#a7f3d0" }}>{detectionData?.rawGesture || "none"}</span> → <span style={{ color: "#f472b6", fontWeight: "700" }}>{detectionData?.stableGesture || "default"}</span>
              </div>
              <div>
                CONFIDENCE: {detectionData?.confidence || 0}% | FPS: {(detectionData?.fps || 0).toFixed(1)}
              </div>
              <div>
                FINGERS: [{detectionData?.signals?.fingers?.join(", ") || "0, 0, 0, 0"}] | THUMB: {detectionData?.signals?.thumbExtended ? (detectionData?.signals?.thumbUp ? "UP" : detectionData?.signals?.thumbDown ? "DOWN" : "EXT") : "TUCKED"}
              </div>
              <div>
                HANDS: {detectionData?.handCount || 0} | PINCH: {detectionData?.signals?.isPinch ? "Yes" : "No"} (ratio {(detectionData?.signals?.pinchRatio || 0).toFixed(2)})
              </div>
              <div>
                HEAD: Yaw {detectionData?.yawDeg ? (detectionData.yawDeg > 0 ? "+" : "") + detectionData.yawDeg.toFixed(1) + "°" : "0.0°"} | Pitch {detectionData?.pitchDeg ? (detectionData.pitchDeg > 0 ? "+" : "") + detectionData.pitchDeg.toFixed(1) + "°" : "0.0°"}
              </div>
            </div>
          )}

          {/* Floating Speech Tag on Video */}
          {isCameraActive && (
            <div style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "#ffe4ee",
              border: "2px solid #18181b",
              borderRadius: "14px",
              padding: "6px 12px",
              boxShadow: "var(--ink-shadow-sm)",
              fontFamily: "var(--font-hand)",
              fontSize: "15px",
              fontWeight: "700",
              color: "#18181b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              pointerEvents: "none"
            }}>
              <span>"{currentMeta.verdict}"</span>
              <span>{currentMeta.icon}</span>
            </div>
          )}

          {/* Controls Bar on bottom of video */}
          {isCameraActive && (
            <div style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              right: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px"
            }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    soundFX.pop();
                    setMirrorVideo(!mirrorVideo);
                  }}
                  onMouseEnter={() => soundFX.hover()}
                  className="comic-btn"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    padding: "4px 10px",
                    fontSize: "12px",
                  }}
                  title="Mirror webcam"
                >
                  <RefreshCw size={13} />
                  <span>Mirror</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.pop();
                    setShowSkeleton(!showSkeleton);
                  }}
                  onMouseEnter={() => soundFX.hover()}
                  className="comic-btn"
                  style={{
                    background: showSkeleton ? "var(--pastel-mint)" : "rgba(255,255,255,0.9)",
                    padding: "4px 10px",
                    fontSize: "12px",
                  }}
                  title="Toggle skeleton landmarks"
                >
                  {showSkeleton ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>Skeleton</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.pop();
                    setShowDebug(!showDebug);
                  }}
                  onMouseEnter={() => soundFX.hover()}
                  className="comic-btn"
                  style={{
                    background: showDebug ? "#fef08a" : "rgba(255,255,255,0.9)",
                    padding: "4px 10px",
                    fontSize: "12px",
                  }}
                  title="Toggle Developer Debug HUD"
                >
                  <Bug size={13} />
                  <span>Debug</span>
                </button>
              </div>

              <button
                onClick={stopCamera}
                onMouseEnter={() => soundFX.hover()}
                className="comic-btn"
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "4px 12px",
                  fontSize: "12px"
                }}
              >
                Stop Cam
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .hammy-cam-stage {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #000000;
          min-height: 350px;
        }
        .hammy-reaction-panel {
          background: #ffffff;
          border-right: 3px solid #18181b;
          padding: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          position: relative;
          min-height: 350px;
          overflow: hidden;
        }
        .hammy-webcam-panel {
          position: relative;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-height: 350px;
        }
        @media (max-width: 680px) {
          .hammy-cam-stage {
            grid-template-columns: 1fr !important;
          }
          .hammy-reaction-panel {
            border-right: none !important;
            border-bottom: 3px solid #18181b !important;
            min-height: 300px !important;
          }
          .hammy-webcam-panel {
            min-height: 280px !important;
          }
        }
      `}</style>
    </div>
  );
}
