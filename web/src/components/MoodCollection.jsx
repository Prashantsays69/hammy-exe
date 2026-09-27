import React, { useState, useEffect } from "react";
import { GESTURE_ORDER, REACTIONS } from "../hamster/reactions";
import { HamsterArt, StickerHamster } from "../hamster/art";
import { soundFX } from "../utils/audio";
import confetti from "canvas-confetti";
import { RotateCcw } from "lucide-react";

export default function MoodCollection({
  unlockedMoods,
  setUnlockedMoods,
  secretCount,
  triedGesturesCount,
  sessionMinutes,
  favoriteMood,
  onSecretClick,
}) {
  const [selectedCard, setSelectedCard] = useState(null);

  const resetProgress = () => {
    soundFX.pop();
    if (window.confirm("Are you sure you want to reset your mood collection?")) {
      const initial = { fist_by_head: true };
      setUnlockedMoods(initial);
      localStorage.setItem("hammy_unlocked", JSON.stringify(initial));
    }
  };

  const unlockedCount = Object.keys(unlockedMoods).length;

  return (
    <section id="collection" style={{
      maxWidth: "1400px",
      margin: "36px auto 40px",
      padding: "0 24px"
    }}>
      {/* Section Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>📖</span>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "24px",
            fontWeight: "900",
            color: "#18181b",
            letterSpacing: "0.5px",
            margin: 0
          }}>
            HAMMY'S MOOD COLLECTION
          </h3>
          <span style={{ fontSize: "20px", color: "#ffd13b" }}>✨</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={resetProgress}
            className="comic-btn"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              background: "#ffffff",
              color: "#64748b"
            }}
            title="Reset unlocked collection"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Polaroids on Left, Stats & Secrets on Right */}
      <div className="mood-collection-grid">
        {/* POLAROIDS ALBUM */}
        <div className="polaroids-grid">
          {GESTURE_ORDER.map((id) => {
            const meta = REACTIONS[id];
            const isUnlocked = Boolean(unlockedMoods[id]);

            return (
              <div
                key={id}
                onClick={() => {
                  soundFX.selectCard();
                  setSelectedCard(meta);
                }}
                onMouseEnter={() => soundFX.hover()}
                className="comic-card"
                style={{
                  position: "relative",
                  background: isUnlocked ? "#ffffff" : "#e2e8f0",
                  padding: "16px 10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  borderRadius: "14px",
                  border: isUnlocked ? "2.5px solid #18181b" : "2px dashed #94a3b8",
                  boxShadow: isUnlocked ? "var(--ink-shadow)" : "none",
                  userSelect: "none"
                }}
              >
                {/* Washi Masking Tape on Top */}
                <div className="washi-tape" />

                {/* Polaroid Frame */}
                <div style={{
                  width: "100%",
                  aspectRatio: "1",
                  background: isUnlocked ? "var(--pastel-yellow-soft)" : "#334155",
                  borderRadius: "10px",
                  border: isUnlocked ? "2px solid #18181b" : "2px solid #1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginBottom: "8px",
                  position: "relative"
                }}>
                  {isUnlocked ? (
                    <HamsterArt type={id} style={{ width: "95%", height: "95%" }} />
                  ) : (
                    /* Locked Silhouette with ? */
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8"
                    }}>
                      <div style={{
                        width: "60px",
                        height: "60px",
                        filter: "brightness(0) opacity(0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <HamsterArt type={id} style={{ width: "100%", height: "100%" }} />
                      </div>
                      <span style={{
                        position: "absolute",
                        fontFamily: "var(--font-display)",
                        fontWeight: "900",
                        fontSize: "26px",
                        color: "#f8fafc"
                      }}>
                        ?
                      </span>
                    </div>
                  )}
                </div>

                {/* Mood Title & Locked/Unlocked Status */}
                <div style={{ textAlign: "center", width: "100%" }}>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "12px",
                    fontWeight: "800",
                    color: isUnlocked ? "#18181b" : "#64748b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {meta.gestureName}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-doodle)",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: isUnlocked ? "#059669" : "#94a3b8",
                    marginTop: "2px"
                  }}>
                    {isUnlocked ? "UNLOCKED!" : "LOCKED"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT SIDEBAR: SECRETS, STATS, POLAROID STICKER */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}>
          {/* Secret Hamsters Box */}
          <div style={{
            background: "var(--pastel-yellow-soft)",
            border: "var(--ink-border)",
            borderRadius: "16px",
            boxShadow: "var(--ink-shadow)",
            padding: "16px",
            position: "relative"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px"
            }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontWeight: "800",
                fontSize: "13px",
                letterSpacing: "0.5px"
              }}>
                FIND THE SECRET HAMSTERS!
              </span>
              <span style={{
                background: "#fef08a",
                border: "1.5px solid #18181b",
                borderRadius: "999px",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: "800"
              }}>
                {secretCount} / 5
              </span>
            </div>

            <p style={{
              fontFamily: "var(--font-doodle)",
              fontSize: "14px",
              color: "#475569",
              fontWeight: "700",
              margin: 0
            }}>
              click around the site... there are 5 hidden hamsters 🐹
            </p>

            {secretCount === 5 && (
              <div style={{
                marginTop: "10px",
                background: "var(--pastel-pink)",
                border: "2px solid #18181b",
                borderRadius: "12px",
                padding: "8px",
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                fontWeight: "800",
                textAlign: "center"
              }}>
                🎉 YOU FOUND THE SECRET HAMSTERS 🐹
              </div>
            )}
          </div>

          {/* YOUR STATS BOX */}
          <div className="retro-terminal" style={{ background: "#ffffff", color: "#18181b" }}>
            <div className="terminal-header" style={{ background: "var(--pastel-mint)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📊</span>
                <span>YOUR STATS</span>
              </div>
            </div>

            <div style={{ padding: "14px", fontFamily: "var(--font-code)", fontSize: "12px", lineHeight: "1.8" }}>
              <div>
                {">"} Reactions unlocked: <strong style={{ color: "#059669" }}>{unlockedCount} / 15</strong>
              </div>
              <div>
                {">"} Time with Hammy: <strong>{sessionMinutes} min</strong>
              </div>
              <div>
                {">"} Gestures tried: <strong>{triedGesturesCount}</strong>
              </div>
              <div>
                {">"} Favorite mood: <strong>{favoriteMood}</strong>
              </div>
            </div>
          </div>

          {/* Polaroid Note: "YOU GOT THIS TWINIEE ♡" */}
          <div style={{
            background: "#ffffff",
            border: "var(--ink-border)",
            borderRadius: "16px",
            boxShadow: "var(--ink-shadow)",
            padding: "16px 16px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "rotate(1.5deg)",
            position: "relative"
          }}>
            <div className="washi-tape" />

            <div style={{
              width: "100%",
              aspectRatio: "1.2",
              background: "var(--pastel-lavender-soft)",
              borderRadius: "10px",
              border: "2px solid #18181b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px"
            }}>
              {/* Clickable Easter Egg 4 */}
              <div
                onClick={() => {
                  onSecretClick(4);
                }}
                style={{ cursor: "pointer" }}
                title="Twiniee! 🐹"
              >
                <StickerHamster pose="waving" size={80} />
              </div>
            </div>

            <div style={{
              fontFamily: "var(--font-hand)",
              fontSize: "19px",
              fontWeight: "700",
              color: "#c084fc",
              textAlign: "center"
            }}>
              YOU GOT THIS TWINIEE ♡
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Card Details Preview if clicked */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="comic-card animate-pop"
            style={{
              maxWidth: "380px",
              width: "100%",
              padding: "24px",
              textAlign: "center",
              background: "#ffffff"
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>
              {selectedCard.icon}
            </div>

            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: "900",
              marginBottom: "4px"
            }}>
              {selectedCard.name}
            </h3>

            <div style={{
              fontFamily: "var(--font-doodle)",
              fontSize: "14px",
              color: "#64748b",
              fontWeight: "700",
              marginBottom: "16px"
            }}>
              Gesture: {selectedCard.gestureName} {selectedCard.gestureSub}
            </div>

            <div style={{
              width: "180px",
              height: "180px",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <HamsterArt type={selectedCard.id} style={{ width: "100%", height: "100%" }} />
            </div>

            <p style={{
              fontFamily: "var(--font-hand)",
              fontSize: "17px",
              color: "#334155",
              marginBottom: "20px",
              lineHeight: "1.4"
            }}>
              {selectedCard.description}
            </p>

            <button
              onClick={() => setSelectedCard(null)}
              className="comic-btn"
              style={{
                background: "var(--pastel-pink)",
                width: "100%",
                padding: "10px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        .mood-collection-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 20px;
          align-items: start;
        }
        .polaroids-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 16px 12px;
          padding: 8px 0;
        }

        @media (max-width: 900px) {
          .mood-collection-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 540px) {
          .polaroids-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px 10px !important;
          }
        }
      `}</style>
    </section>
  );
}
