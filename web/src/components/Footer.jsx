import React from "react";
import { soundFX } from "../utils/audio";

export default function Footer({ onSecretClick }) {
  const socials = [
    {
      name: "GitHub",
      url: "https://github.com/Prashantsays69",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/iam_prash99/",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/prashant-ratnala/",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.89 0-1.61.72-1.61 1.61 0 .89.72 1.61 1.61 1.61.89 0 1.61-.72 1.61-1.61 0-.89-.72-1.61-1.61-1.61z" />
        </svg>
      ),
    },
  ];

  return (
    <footer
      id="about"
      className="hammy-pink-footer"
      style={{
        background: "var(--pastel-pink)",
        borderTop: "3px solid #18181b",
        width: "100%",
        marginTop: "32px",
        padding: "26px 16px 18px",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div className="footer-layout-container">
        {/* Left Hamster Sticker & zzz... (Desktop flanking / Mobile row) */}
        <div
          className="footer-deco-sticker deco-left"
          onClick={(e) => {
            e.stopPropagation();
            if (onSecretClick) onSecretClick(5);
            else soundFX.squeak();
          }}
          title="Zzz... wake up hammy! 🐹"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (onSecretClick) onSecretClick(5);
              else soundFX.squeak();
            }
          }}
        >
          <span className="deco-bubble">zzz...</span>
          <img
            src="/images/plain_hamster.png"
            alt="Sleeping hammy"
            className="deco-img"
          />
        </div>

        {/* Centered Scrapbook Creator Card */}
        <div className="creator-card">
          {/* Taped scrapbook sticker on top-right of card */}
          <div
            className="card-taped-sticker"
            onClick={(e) => {
              e.stopPropagation();
              if (onSecretClick) onSecretClick(5);
              else soundFX.squeak();
            }}
            title="Psst... 🐹"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (onSecretClick) onSecretClick(5);
                else soundFX.squeak();
              }
            }}
          >
            <div className="mini-washi-tape" />
            <img
              src="/images/pajama_hamster.png"
              alt="Hammy"
              className="taped-sticker-img"
            />
          </div>

          {/* Top Line: made by [ Prashant 🐹 ] */}
          <div className="creator-title">
            <span>made by</span>
            <span className="creator-pill">
              <span>Prashant</span>
              <span className="creator-emoji">🐹</span>
            </span>
          </div>

          {/* Compact Under-Title Description */}
          <p className="creator-subtitle">
            made with too much caffeine, questionable debugging decisions, and one emotionally unstable hamster
          </p>

          {/* Three Compact Social Buttons */}
          <div className="creator-socials">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="creator-pill-btn"
                onClick={() => soundFX && soundFX.pop && soundFX.pop()}
                onMouseEnter={() => soundFX && soundFX.hover && soundFX.hover()}
              >
                <span className="creator-btn-icon">{s.icon}</span>
                <span>{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right Hamster Sticker & stay silly! ✨ (Plays Hammy squeak SFX) */}
        <div
          className="footer-deco-sticker deco-right"
          onClick={(e) => {
            e.stopPropagation();
            soundFX.squeak();
          }}
          title="stay silly! ✨ 🐹"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              soundFX.squeak();
            }
          }}
        >
          <img
            src="/images/thumbs_up_sticker.png"
            alt="Happy hammy"
            className="deco-img"
          />
          <span className="deco-bubble">stay silly! ✨</span>
        </div>
      </div>

      {/* Small Understated Copyright Line */}
      <div className="creator-bottom-footer">
        © 2026 HAMMY.EXE · made with 💗 for the sillies
      </div>

      <style>{`
        .footer-layout-container {
          max-width: 1060px;
          margin: 0 auto;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }

        /* Decorative Hamster Stickers */
        .footer-deco-sticker {
          display: flex;
          align-items: center;
          gap: 6px;
          position: absolute;
          cursor: pointer;
          user-select: none;
          touch-action: manipulation;
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2;
        }

        .deco-left {
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
        .deco-left:hover {
          transform: translateY(calc(-50% - 2px)) scale(1.05);
        }
        .deco-left:active {
          transform: translateY(-50%) scale(0.94);
        }

        .deco-right {
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
        .deco-right:hover {
          transform: translateY(calc(-50% - 2px)) scale(1.05);
        }
        .deco-right:active {
          transform: translateY(-50%) scale(0.94);
        }

        .deco-bubble {
          font-family: var(--font-doodle);
          font-size: 13px;
          font-weight: 700;
          color: #18181b;
          background: rgba(255, 255, 255, 0.9);
          border: 1.5px solid #18181b;
          border-radius: 8px;
          padding: 2px 7px;
          box-shadow: 1.5px 1.5px 0px #18181b;
          white-space: nowrap;
          pointer-events: none;
        }

        .deco-img {
          width: 38px;
          height: 38px;
          object-fit: contain;
          filter: drop-shadow(2px 2px 0px rgba(24, 24, 27, 0.2));
          pointer-events: none;
        }

        /* Centered White Creator Card */
        .creator-card {
          position: relative;
          background: #ffffff;
          border: var(--ink-border);
          border-radius: 18px;
          box-shadow: var(--ink-shadow);
          padding: 20px 24px 17px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          margin: 0 auto;
          box-sizing: border-box;
          z-index: 1;
        }

        /* Taped Sticker on Card Edge */
        .card-taped-sticker {
          position: absolute;
          top: -14px;
          right: 16px;
          cursor: pointer;
          user-select: none;
          touch-action: manipulation;
          transition: transform 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .card-taped-sticker:hover {
          transform: translateY(-2px) scale(1.06);
        }
        .card-taped-sticker:active {
          transform: scale(0.95);
        }

        .mini-washi-tape {
          width: 28px;
          height: 9px;
          background: rgba(254, 240, 138, 0.9);
          border-left: 1.5px dashed rgba(200, 180, 80, 0.8);
          border-right: 1.5px dashed rgba(200, 180, 80, 0.8);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          transform: rotate(-3deg);
          margin-bottom: -4px;
          z-index: 2;
        }

        .taped-sticker-img {
          width: 35px;
          height: 35px;
          object-fit: cover;
          border-radius: 9px;
          border: 1.5px solid #18181b;
          box-shadow: 1.5px 1.5px 0px #18181b;
          background: #ffffff;
          display: block;
          pointer-events: none;
        }

        .creator-title {
          font-family: var(--font-display);
          font-size: 17.5px;
          font-weight: 800;
          color: #18181b;
          line-height: 1.2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .creator-pill {
          background: var(--pastel-pink);
          border: 2px solid #18181b;
          border-radius: 999px;
          padding: 2px 10px;
          box-shadow: 1.5px 1.5px 0px #18181b;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 15px;
          font-weight: 800;
          color: #18181b;
        }

        .creator-emoji {
          font-size: 13.5px;
          line-height: 1;
        }

        .creator-subtitle {
          font-family: var(--font-doodle);
          font-size: 13.5px;
          font-weight: 700;
          color: #52525b;
          margin: 8px auto 14px;
          line-height: 1.35;
          max-width: 340px;
        }

        .creator-socials {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .creator-pill-btn {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          color: #18181b;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          background: #ffffff;
          border: 2px solid #18181b;
          border-radius: 999px;
          box-shadow: 2px 2px 0px #18181b;
          transition: all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
          touch-action: manipulation;
        }

        .creator-pill-btn:hover {
          background: #fff5f8;
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #18181b;
        }

        .creator-pill-btn:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0px #18181b;
        }

        .creator-btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #18181b;
        }

        .creator-bottom-footer {
          font-family: var(--font-doodle);
          font-size: 13px;
          font-weight: 700;
          color: #18181b;
          margin-top: 14px;
          text-align: center;
          user-select: none;
        }

        /* Tablet & Mobile responsive behavior: wrap stickers neatly below card */
        @media (max-width: 780px) {
          .footer-layout-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 12px;
          }
          .creator-card {
            order: 1;
            width: 100%;
          }
          .footer-deco-sticker {
            position: static !important;
            transform: none !important;
            order: 2;
          }
          .deco-left:hover, .deco-right:hover {
            transform: translateY(-2px) scale(1.05) !important;
          }
          .deco-left:active, .deco-right:active {
            transform: scale(0.94) !important;
          }
        }

        @media (max-width: 480px) {
          .hammy-pink-footer {
            padding: 22px 12px 14px !important;
            margin-top: 24px !important;
          }
          .creator-card {
            padding: 16px 14px 14px !important;
            border-radius: 16px !important;
          }
          .card-taped-sticker {
            top: -12px !important;
            right: 12px !important;
          }
          .taped-sticker-img {
            width: 32px !important;
            height: 32px !important;
          }
          .creator-title {
            font-size: 16px !important;
            gap: 4px !important;
          }
          .creator-pill {
            font-size: 14px !important;
            padding: 2px 8px !important;
          }
          .creator-subtitle {
            font-size: 12.5px !important;
            margin: 7px auto 12px !important;
            max-width: 300px !important;
          }
          .creator-socials {
            gap: 7px !important;
          }
          .creator-pill-btn {
            font-size: 11.5px !important;
            padding: 5px 11px !important;
          }
          .creator-bottom-footer {
            font-size: 12px !important;
            margin-top: 12px !important;
          }
        }

        @media (max-width: 360px) {
          .creator-pill-btn {
            padding: 5px 9px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </footer>
  );
}
