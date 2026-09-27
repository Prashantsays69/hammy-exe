import React from "react";
import { StickerHamster } from "../hamster/art";
import { soundFX } from "../utils/audio";

export default function Footer({ onSecretClick }) {
  const socials = [
    {
      name: "GitHub",
      url: "https://github.com/Prashantsays69",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/iam_prash99/",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.89 0-1.61.72-1.61 1.61 0 .89.72 1.61 1.61 1.61.89 0 1.61-.72 1.61-1.61 0-.89-.72-1.61-1.61-1.61z" />
        </svg>
      ),
    },
  ];

  return (
    <footer
      id="about"
      className="hammy-about-footer"
      style={{
        padding: "48px 16px 36px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        position: "relative",
      }}
    >
      <div className="creator-card">
        {/* Subtle sleeping hamster easter egg perched on top */}
        <div
          onClick={() => onSecretClick && onSecretClick(5)}
          title="Zzz... wake up hammy! 🐹"
          className="creator-hamster-egg"
        >
          <span className="creator-zzz">zzz...</span>
          <StickerHamster pose="sleeping" size={38} />
        </div>

        {/* Main signature */}
        <div className="creator-title">
          made by <span className="creator-name">Prashant</span> 🐹
        </div>

        {/* Playful secondary text */}
        <p className="creator-subtitle">
          made with too much caffeine &amp; one emotionally unstable hamster
        </p>

        {/* 3 Compact social buttons */}
        <div className="creator-socials">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="creator-btn"
              onClick={() => soundFX && soundFX.pop && soundFX.pop()}
              onMouseEnter={() => soundFX && soundFX.hover && soundFX.hover()}
            >
              <span className="creator-icon">{s.icon}</span>
              <span>{s.name}</span>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .creator-card {
          position: relative;
          background: #ffffff;
          border: var(--ink-border);
          border-radius: 20px;
          box-shadow: var(--ink-shadow);
          padding: 22px 28px 20px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          margin: 0 auto;
        }

        .creator-hamster-egg {
          position: absolute;
          top: -24px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          user-select: none;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .creator-hamster-egg:hover {
          transform: translateY(-2px) scale(1.08);
        }

        .creator-zzz {
          font-family: var(--font-doodle);
          font-size: 13px;
          font-weight: 700;
          color: #71717a;
          background: #fffbeb;
          padding: 1px 6px;
          border-radius: 8px;
          border: 1.5px solid #18181b;
          box-shadow: 1px 1px 0px #18181b;
        }

        .creator-title {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 800;
          color: #18181b;
          line-height: 1.2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .creator-name {
          background: var(--pastel-pink);
          padding: 2px 10px;
          border-radius: 10px;
          border: 1.5px solid #18181b;
          box-shadow: 1.5px 1.5px 0px #18181b;
          color: #18181b;
          display: inline-block;
        }

        .creator-subtitle {
          font-family: var(--font-doodle);
          font-size: 15px;
          font-weight: 700;
          color: #52525b;
          margin: 10px 0 16px 0;
          line-height: 1.35;
        }

        .creator-socials {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .creator-btn {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: #18181b;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: #fffbf5;
          border: 2px solid #18181b;
          border-radius: 12px;
          box-shadow: 2px 2px 0px #18181b;
          transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
          touch-action: manipulation;
        }

        .creator-btn:hover {
          background: var(--pastel-pink);
          transform: translate(-1px, -2px);
          box-shadow: 3px 3px 0px #18181b;
        }

        .creator-btn:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0px #18181b;
        }

        .creator-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #18181b;
        }

        @media (max-width: 480px) {
          .creator-card {
            padding: 20px 16px 16px;
          }
          .creator-title {
            font-size: 17px;
          }
          .creator-subtitle {
            font-size: 14px;
            margin: 8px 0 14px 0;
          }
          .creator-socials {
            gap: 8px;
          }
          .creator-btn {
            font-size: 12px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </footer>
  );
}
