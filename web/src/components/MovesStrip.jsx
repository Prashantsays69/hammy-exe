import React from "react";
import { GESTURE_ORDER, REACTIONS } from "../hamster/reactions";
import { HamsterArt } from "../hamster/art";
import { soundFX } from "../utils/audio";

export default function MovesStrip({ activeGestureId, onSelectGesture }) {
  return (
    <section style={{
      maxWidth: "1480px",
      margin: "24px auto 16px",
      padding: "0 clamp(14px, 2.5vw, 20px)",
      width: "100%",
      minWidth: 0
    }}>
      {/* Title */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        flexWrap: "wrap"
      }}>
        <span style={{ fontSize: "22px", color: "#ffd13b" }}>⭐</span>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(18px, 2.5vw, 22px)",
          fontWeight: "900",
          letterSpacing: "0.5px",
          color: "#18181b",
          margin: 0
        }}>
          TEACH HAMMY YOUR MOVES!
        </h3>
        <span style={{
          fontFamily: "var(--font-doodle)",
          fontSize: "clamp(13px, 1.8vw, 16px)",
          color: "#64748b",
          fontWeight: "700"
        }}>
          TRY THESE GESTURES:
        </span>
      </div>

      {/* Horizontal Strip - Hidden scrollbar on mobile with smooth touch swipe */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "12px",
          paddingTop: "14px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          width: "100%"
        }}
      >
        {GESTURE_ORDER.map((id) => {
          const meta = REACTIONS[id];
          const isActive = activeGestureId === id;

          return (
            <div
              key={id}
              onClick={() => {
                soundFX.reaction(id);
                onSelectGesture(id);
              }}
              onMouseEnter={() => soundFX.hover()}
              className={`comic-card ${isActive ? "animate-pulse-glow" : ""}`}
              style={{
                flex: "0 0 120px",
                minHeight: "220px",
                scrollSnapAlign: "start",
                padding: "8px 6px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                background: isActive ? "var(--pastel-pink-soft)" : "#ffffff",
                border: isActive ? "3px solid #ff6599" : "2.5px solid #18181b",
                transform: isActive ? "scale(1.05) translateY(-4px)" : "none",
                transition: "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
                position: "relative",
                userSelect: "none",
                boxSizing: "border-box"
              }}
            >
              {/* Active Badge */}
              {isActive && (
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  background: "#ff6599",
                  color: "#ffffff",
                  fontSize: "9px",
                  fontWeight: "900",
                  padding: "2px 6px",
                  borderRadius: "999px",
                  border: "1.5px solid #18181b",
                  boxShadow: "1px 1px 0px #18181b",
                  zIndex: 2
                }}>
                  ACTIVE!
                </div>
              )}

              {/* Photo / Icon representation at top */}
              <div style={{
                width: "92px",
                height: "62px",
                borderRadius: "10px",
                border: "2px solid #18181b",
                overflow: "hidden",
                background: "#f1f5f9",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                {meta.image ? (
                  <img
                    src={meta.image}
                    alt={meta.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "28px" }}>{meta.icon}</span>
                )}
              </div>

              {/* Gesture Name & Subtitle */}
              <div style={{
                textAlign: "center",
                width: "100%",
                minHeight: "38px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "6px",
                flexShrink: 0
              }}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "11px",
                  fontWeight: "900",
                  color: "#18181b",
                  lineHeight: 1.15,
                  padding: "0 2px",
                  wordBreak: "break-word"
                }}>
                  {meta.gestureName}
                </div>
                <div style={{
                  fontFamily: "var(--font-doodle)",
                  fontSize: "12px",
                  color: "#64748b",
                  fontWeight: "700",
                  lineHeight: 1.2,
                  marginTop: "2px"
                }}>
                  {meta.gestureSub}
                </div>
              </div>

              {/* Hamster Preview Illustration */}
              <div style={{
                width: "74px",
                height: "74px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <HamsterArt type={id} style={{ width: "100%", height: "100%" }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
