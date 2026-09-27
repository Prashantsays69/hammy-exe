import React, { useEffect, useRef } from "react";
import { StickerHamster } from "../hamster/art";
import { soundFX } from "../utils/audio";

export default function HammyBrain({ detectionData, activeReaction, isCameraActive, onSecretClick }) {
  const hasFace = detectionData?.hasFace ?? false;
  const handCount = detectionData?.handCount ?? 0;
  const rawConfidence = detectionData?.confidence || 0;

  // Strict confidence check: If camera is off or no reliable gesture was classified
  const isReliable = isCameraActive && (detectionData?.stableGesture && detectionData?.stableGesture !== "default");
  const displayGesture = isReliable ? (activeReaction?.gestureName || "NONE") : "NONE";
  const displayConfidence = isReliable ? rawConfidence : 0;
  const displayReaction = isReliable ? (activeReaction?.name || "POKER FACE") : "POKER FACE";
  const displayVerdict = isReliable ? (activeReaction?.verdict || "hammy is judging you...") : "hammy is judging you...";
  const displayIcon = isReliable ? (activeReaction?.icon || "😐") : "😐";

  // Trigger subtle brain blip on status change and verdict sound on recognition
  const prevGestureRef = useRef("NONE");
  const prevFaceRef = useRef(false);

  useEffect(() => {
    if (!isCameraActive) return;

    if (displayGesture !== prevGestureRef.current) {
      prevGestureRef.current = displayGesture;
      if (displayGesture !== "NONE") {
        soundFX.brainVerdict();
      }
    } else if (hasFace !== prevFaceRef.current) {
      prevFaceRef.current = hasFace;
      soundFX.brainBlip();
    }
  }, [displayGesture, hasFace, isCameraActive]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      width: "100%",
    }}>
      {/* Retro CRT Terminal Window */}
      <div className="retro-terminal">
        {/* Header Bar */}
        <div className="terminal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>👾</span>
            <span>HAMMY BRAIN.exe</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <span onClick={() => soundFX.pop()} style={{ cursor: "pointer" }}>_</span>
            <span onClick={() => soundFX.pop()} style={{ cursor: "pointer" }}>□</span>
            <span onClick={() => soundFX.pop()} style={{ cursor: "pointer" }}>✕</span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="terminal-body">
          <div style={{ color: "#86efac", marginBottom: "6px" }}>
            {">"} face detected : <span style={{ color: hasFace ? "#4ade80" : "#f87171" }}>{hasFace ? "yes" : "no"}</span>
          </div>

          <div style={{ color: "#86efac", marginBottom: "6px" }}>
            {">"} hand detected : <span style={{ color: handCount > 0 ? "#4ade80" : "#f87171" }}>{handCount > 0 ? `yes (${handCount})` : "no"}</span>
          </div>

          <div style={{ color: "#86efac", marginBottom: "6px" }}>
            {">"} gesture : <span style={{ color: isReliable ? "#fde047" : "#94a3b8", fontWeight: "bold" }}>{displayGesture}</span>
          </div>

          <div style={{ color: "#86efac", marginBottom: "6px" }}>
            {">"} confidence : <span style={{ color: isReliable ? "#38bdf8" : "#94a3b8" }}>{displayConfidence}%</span>
          </div>

          <div style={{ color: "#86efac", marginBottom: "12px" }}>
            {">"} reaction : <span style={{ color: isReliable ? "#f472b6" : "#cbd5e1", fontWeight: "bold" }}>{displayReaction}</span>
          </div>

          <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.2)", paddingTop: "10px", marginTop: "10px" }}>
            <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "3px" }}>
              {">"} verdict :
            </div>
            <div style={{
              color: "#fef08a",
              fontFamily: "var(--font-doodle)",
              fontSize: "16px",
              fontWeight: "700"
            }}>
              "{displayVerdict}" {displayIcon}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar Pills & Note */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap"
        }}>
          {/* Camera status pill */}
          <div style={{
            background: isCameraActive ? "#dcfce7" : "#fee2e2",
            border: "2px solid #18181b",
            borderRadius: "10px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: isCameraActive ? "#15803d" : "#991b1b",
            boxShadow: "var(--ink-shadow-sm)"
          }}>
            <span>📷</span>
            <span>Camera: {isCameraActive ? "Connected" : "Disconnected"}</span>
          </div>

          {/* Mic status pill */}
          <div style={{
            background: "#dbeafe",
            border: "2px solid #18181b",
            borderRadius: "10px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: "#1e40af",
            boxShadow: "var(--ink-shadow-sm)"
          }}>
            <span>🎙️</span>
            <span>Mic: Not used</span>
          </div>
        </div>

        {/* Soft Yellow Wholesome Note with Peeking Hamster */}
        <div style={{
          background: "var(--pastel-yellow-soft)",
          border: "2px solid #18181b",
          borderRadius: "12px",
          padding: "8px 12px",
          boxShadow: "var(--ink-shadow-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px"
        }}>
          <div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: "800",
              color: "#854d0e",
              textTransform: "uppercase"
            }}>
              HAMMY IS WATCHING...
            </div>
            <div style={{
              fontFamily: "var(--font-hand)",
              fontSize: "15px",
              fontWeight: "700",
              color: "#18181b"
            }}>
              and he is proud of you (probably) ❤️
            </div>
          </div>

          {/* Clickable Easter Egg 3 */}
          <div
            onClick={() => {
              onSecretClick(3);
            }}
            title="Psst! 🐹"
            style={{ cursor: "pointer" }}
          >
            <StickerHamster pose="peeking" size={38} />
          </div>
        </div>
      </div>
    </div>
  );
}
