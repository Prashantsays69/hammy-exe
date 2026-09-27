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
        marginTop: "40px",
        padding: "36px 16px 22px",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div className="footer-inner-container">
        {/* Left Playful Hamster Decoration (Desktop/Tablet) */}
        <div
          className="footer-side-deco left-deco"
          onClick={() => onSecretClick && onSecretClick(5)}
          title="Zzz... wake up hammy! 🐹"
        >
          <span className="deco-tag">zzz...</span>
          <img
            src="/images/plain_hamster.png"
            alt="Sleeping hammy"
            className="deco-hamster-img"
          />
        </div>

        {/* Centered Compact White Creator Card */}
        <div className="creator-card">
          {/* Small decorative hamster sticker attached near the top-right edge */}
          <div
            className="card-hamster-sticker"
            onClick={() => onSecretClick && onSecretClick(5)}
            title="Psst... 🐹"
          >
            <img
              src="/images/pajama_hamster.png"
              alt="Hammy"
              className="sticker-hamster-img"
            />
          </div>

          {/* Main line: made by [ Prashant 🐹 ] */}
          <div className="creator-title">
            <span>made by</span>
            <span className="creator-pill">
              <span>Prashant</span>
              <span className="creator-emoji">🐹</span>
            </span>
          </div>

          {/* Subtitle / Description */}
          <p className="creator-subtitle">
            made with too much caffeine, questionable debugging decisions, and one emotionally unstable hamster
          </p>

          {/* Exactly Three Social Buttons */}
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

        {/* Right Playful Hamster Decoration (Desktop/Tablet) */}
        <div className="footer-side-deco right-deco">
          <img
            src="/images/thumbs_up_sticker.png"
            alt="Happy hammy"
            className="deco-hamster-img"
          />
          <span className="deco-tag">stay silly! ✨</span>
        </div>
      </div>

      {/* Small centered copyright/footer line */}
      <div className="creator-bottom-footer">
        © 2026 HAMMY.EXE · made with 💖 for the sillies
      </div>

      <style>{`
        .footer-inner-container {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-side-deco {
          display: flex;
          align-items: center;
          gap: 8px;
          position: absolute;
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s ease;
        }
        .footer-side-deco:hover {
          transform: translateY(-2px);
        }

        .left-deco {
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
        .left-deco:hover {
          transform: translateY(calc(-50% - 2px));
        }

        .right-deco {
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
        .right-deco:hover {
          transform: translateY(calc(-50% - 2px));
        }

        .deco-tag {
          font-family: var(--font-doodle);
          font-size: 13px;
          font-weight: 700;
          color: #18181b;
          background: rgba(255, 255, 255, 0.85);
          border: 1.5px solid #18181b;
          border-radius: 8px;
          padding: 2px 8px;
          box-shadow: 1.5px 1.5px 0px #18181b;
          white-space: nowrap;
        }

        .deco-hamster-img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          filter: drop-shadow(2px 2px 0px rgba(24, 24, 27, 0.2));
          pointer-events: none;
        }

        /* Centered White Creator Card */
        .creator-card {
          position: relative;
          background: #ffffff;
          border: var(--ink-border);
          border-radius: 20px;
          box-shadow: var(--ink-shadow);
          padding: 24px 26px 20px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .card-hamster-sticker {
          position: absolute;
          top: -16px;
          right: 18px;
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s ease;
        }
        .card-hamster-sticker:hover {
          transform: translateY(-2px) scale(1.08);
        }

        .sticker-hamster-img {
          width: 38px;
          height: 38px;
          object-fit: cover;
          border-radius: 10px;
          border: 1.5px solid #18181b;
          box-shadow: 1.5px 1.5px 0px #18181b;
          background: #ffffff;
          display: block;
        }

        .creator-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: #18181b;
          line-height: 1.2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .creator-pill {
          background: var(--pastel-pink);
          border: 2px solid #18181b;
          border-radius: 999px;
          padding: 2px 10px;
          box-shadow: 1.5px 1.5px 0px #18181b;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 15.5px;
          font-weight: 800;
          color: #18181b;
        }

        .creator-emoji {
          font-size: 13.5px;
          line-height: 1;
        }

        .creator-subtitle {
          font-family: var(--font-doodle);
          font-size: 14px;
          font-weight: 700;
          color: #52525b;
          margin: 10px auto 16px;
          line-height: 1.35;
          max-width: 350px;
        }

        .creator-socials {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .creator-pill-btn {
          font-family: var(--font-display);
          font-size: 12.5px;
          font-weight: 700;
          color: #18181b;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
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
          font-size: 14px;
          font-weight: 700;
          color: #18181b;
          margin-top: 18px;
          text-align: center;
          user-select: none;
        }

        /* Tablet Breakpoint: Hide side decorations to avoid crowding */
        @media (max-width: 860px) {
          .footer-side-deco {
            display: none !important;
          }
        }

        /* Mobile Breakpoint: Adaptive padding & spacing */
        @media (max-width: 480px) {
          .hammy-pink-footer {
            padding: 26px 14px 18px !important;
            margin-top: 30px !important;
          }
          .creator-card {
            padding: 18px 16px 16px !important;
          }
          .creator-title {
            font-size: 16px !important;
            gap: 5px !important;
          }
          .creator-pill {
            font-size: 14px !important;
            padding: 2px 8px !important;
          }
          .creator-subtitle {
            font-size: 13px !important;
            margin: 8px auto 14px !important;
          }
          .creator-socials {
            gap: 8px !important;
          }
          .creator-pill-btn {
            font-size: 12px !important;
            padding: 5px 12px !important;
          }
          .creator-bottom-footer {
            font-size: 13px !important;
            margin-top: 14px !important;
          }
        }
      `}</style>
    </footer>
  );
}
