import React from "react";
import { StickerHamster } from "../hamster/art";
import { soundFX } from "../utils/audio";

export default function Footer({ onSecretClick }) {
  return (
    <footer
      id="about"
      className="hammy-footer"
      style={{
        background: "var(--pastel-pink)",
        borderTop: "3px solid #18181b",
        padding: "16px 20px",
        marginTop: "40px",
        fontFamily: "var(--font-doodle)",
        fontSize: "15px",
        fontWeight: "700",
        color: "#18181b",
        width: "100%"
      }}
    >
      <div className="footer-content">
        {/* Left: Sleeping Hamster & zzz */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>zzz...</span>
          {/* Clickable Easter Egg 5 */}
          <div
            onClick={() => {
              onSecretClick(5);
            }}
            title="Zzz... wake up hammy! 🐹"
            style={{ cursor: "pointer" }}
          >
            <StickerHamster pose="sleeping" size={42} />
          </div>
        </div>

        {/* Middle: Credits & Microcopy */}
        <div className="footer-links">
          <span>made with 💖 for the sillies</span>
          <span className="footer-sep">|</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: "800" }}>hammy.exe</span>
          <span className="footer-sep">|</span>
          <span>a hamster for every mood</span>
          <span className="footer-sep">|</span>
          <span>stay silly</span>
        </div>

        {/* Right: Decorative Hamsters */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <StickerHamster pose="peeking" size={32} />
          <span style={{ fontSize: "16px" }}>🐹</span>
        </div>
      </div>

      <style>{`
        .footer-content {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          flex-wrap: wrap;
          gap: 12px;
          max-width: 1480px;
          margin: 0 auto;
          width: 100%;
        }
        .footer-links {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        @media (max-width: 680px) {
          .footer-content {
            flex-direction: column !important;
            text-align: center !important;
            gap: 10px !important;
          }
          .footer-links {
            flex-direction: column !important;
            gap: 4px !important;
          }
          .footer-sep {
            display: none !important;
          }
        }
      `}</style>
    </footer>
  );
}
