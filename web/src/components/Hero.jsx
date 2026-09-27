import React from "react";
import { StickerHamster } from "../hamster/art";
import { soundFX, audioManager } from "../utils/audio";

export default function Hero({ onEnterZone, onSecretClick }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      justifyContent: "center",
      width: "100%",
      minWidth: 0
    }}>
      {/* Big Headline */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", position: "relative" }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.2vw, 42px)",
            fontWeight: "900",
            lineHeight: 1.08,
            letterSpacing: "-0.5px",
            color: "#18181b",
            textTransform: "uppercase",
            margin: 0
          }}>
            MAKE A FACE. <br />
            HAMMY JUDGES YOU.
          </h2>

          {/* Hamster Looking Up at title */}
          <div
            onClick={() => {
              onSecretClick(2);
            }}
            style={{ cursor: "pointer", flexShrink: 0, marginTop: "2px" }}
            title="Squeak! 🐹"
          >
            <StickerHamster pose="waving" size={46} />
          </div>
        </div>

        <p style={{
          fontFamily: "var(--font-hand)",
          fontSize: "clamp(16px, 1.8vw, 20px)",
          color: "#334155",
          fontWeight: "600",
          marginTop: "8px",
          lineHeight: 1.3
        }}>
          Your webcam + some questionable hand gestures <br />
          = one emotionally unstable hamster.
        </p>
      </div>

      {/* CTA Button */}
      <div>
        <button
          onClick={() => {
            soundFX.cta();
            audioManager.startMusicOnInteraction();
            onEnterZone();
          }}
          onMouseEnter={() => soundFX.hover()}
          className="comic-btn"
          style={{
            background: "var(--pastel-pink)",
            color: "#18181b",
            fontSize: "clamp(14px, 1.6vw, 16px)",
            padding: "10px 20px",
            borderRadius: "14px",
            width: "100%",
            maxWidth: "340px",
            justifyContent: "space-between"
          }}
        >
          <span>ENTER THE HAMSTER ZONE</span>
          <span style={{ fontSize: "18px" }}>→</span>
        </button>
      </div>

      {/* Camera Required Notice Card */}
      <div style={{
        background: "var(--pastel-yellow)",
        border: "var(--ink-border)",
        borderRadius: "14px",
        boxShadow: "var(--ink-shadow-sm)",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        position: "relative",
        maxWidth: "400px"
      }}>
        <span style={{ fontSize: "22px", flexShrink: 0 }}>📷</span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-display)",
            fontWeight: "900",
            fontSize: "12px",
            letterSpacing: "0.5px"
          }}>
            CAMERA REQUIRED
          </div>
          <div style={{
            fontFamily: "var(--font-doodle)",
            fontSize: "13px",
            color: "#475569",
            fontWeight: "700",
            lineHeight: 1.2
          }}>
            we promise we're not saving your face <br />
            (hammy just wants to see you)
          </div>
        </div>

        {/* Small peeking hamster */}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <StickerHamster pose="peeking" size={32} />
        </div>
      </div>
    </div>
  );
}
