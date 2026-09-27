import React, { useState, useEffect } from "react";
import { StickerHamster } from "../hamster/art";
import { soundFX, audioManager } from "../utils/audio";
import { Menu, X } from "lucide-react";

export default function Header({ activeTab, setActiveTab, onSecretClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRadioPlaying, setIsRadioPlaying] = useState(audioManager.isMusicPlaying);

  useEffect(() => {
    return audioManager.subscribe((state) => {
      setIsRadioPlaying(state.isPlaying);
    });
  }, []);

  const handleNavClick = (tabId) => {
    soundFX.pop();
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { id: "hero", label: "Home", icon: "🏠" },
    { id: "cam", label: "Play", icon: "🎮" },
    { id: "collection", label: "Collection", icon: "⭐" },
    { id: "about", label: "About", icon: "ℹ️" },
  ];

  return (
    <header style={{
      padding: "12px 16px",
      maxWidth: "1480px",
      margin: "0 auto",
      width: "100%",
      position: "relative",
      zIndex: 40
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        width: "100%"
      }}>
        {/* Left: Logo & Subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {/* Clickable Easter Egg Hamster 1 */}
          <div 
            onClick={() => {
              onSecretClick(1);
            }}
            title="Psst... click me! 🐹"
            style={{ cursor: "pointer", flexShrink: 0 }}
            className="animate-wobble"
          >
            <StickerHamster pose="waving" size={48} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 4vw, 34px)",
                fontWeight: "900",
                letterSpacing: "0.5px",
                color: "#18181b",
                textShadow: "2px 2px 0px #ffb8d1",
                margin: 0,
                lineHeight: 1,
                whiteSpace: "nowrap"
              }}>
                HAMMY.EXE
              </h1>
              <span style={{ fontSize: "18px", color: "#ffd13b" }}>✨</span>
            </div>
            <p style={{
              fontFamily: "var(--font-doodle)",
              fontSize: "clamp(12px, 2vw, 16px)",
              color: "#475569",
              fontWeight: "700",
              margin: "2px 0 0 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              your webcam is now hamster-controlled.
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Hidden on mobile) */}
        <nav
          className="desktop-nav"
          style={{
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            padding: "5px 8px",
            borderRadius: "18px",
            border: "var(--ink-border)",
            boxShadow: "var(--ink-shadow)"
          }}
        >
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id)}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: "700",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "12px",
                  border: isActive ? "2px solid #18181b" : "2px solid transparent",
                  background: isActive ? "var(--pastel-pink)" : "transparent",
                  color: "#18181b",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? "2px 2px 0px #18181b" : "none"
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: HAMMY RADIO + Desktop Speech Bubble + LET'S GO / Mobile Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* HAMMY RADIO ON / OFF Toggle Button */}
          <button
            onClick={() => {
              soundFX.pop();
              audioManager.toggleMusic();
            }}
            onMouseEnter={() => soundFX.hover()}
            className="comic-btn hammy-radio-btn"
            style={{
              background: isRadioPlaying ? "var(--pastel-mint)" : "#ffffff",
              color: "#18181b",
              fontSize: "12px",
              padding: "6px 12px",
              gap: "6px",
            }}
            title="HAMMY RADIO: Just The Way You Are (Sped Up)"
            aria-label="Toggle Hammy Radio"
          >
            <span style={{ fontSize: "14px" }}>📻</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "800", letterSpacing: "0.3px" }}>
              HAMMY RADIO
            </span>
            <span style={{
              fontSize: "11px",
              fontWeight: "900",
              color: isRadioPlaying ? "#065f46" : "#64748b",
              background: isRadioPlaying ? "rgba(255,255,255,0.7)" : "#f1f5f9",
              padding: "1px 6px",
              borderRadius: "999px",
              border: "1px solid #18181b"
            }}>
              {isRadioPlaying ? "🔊 ON" : "🔇 OFF"}
            </span>
          </button>

          {/* Quote speech bubble (Desktop only) */}
          <div
            className="desktop-bubble"
            style={{
              background: "#fffbeb",
              border: "2px solid #18181b",
              borderRadius: "14px",
              padding: "5px 10px",
              fontSize: "12px",
              fontWeight: "700",
              boxShadow: "var(--ink-shadow-sm)",
              alignItems: "center",
              gap: "5px"
            }}
          >
            <span>🐹</span>
            <span>a hamster for every mood!</span>
          </div>

          {/* LET'S GO CTA */}
          <button
            onClick={() => {
              soundFX.cta();
              audioManager.startMusicOnInteraction();
              handleNavClick("cam");
            }}
            onMouseEnter={() => soundFX.hover()}
            className="comic-btn"
            style={{
              background: "var(--pastel-pink)",
              color: "#18181b",
              fontSize: "13px",
              padding: "7px 14px",
            }}
          >
            <span>LET'S GO!</span>
            <span>🐹</span>
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => {
              soundFX.pop();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="mobile-menu-btn comic-btn"
            style={{
              background: mobileMenuOpen ? "var(--pastel-yellow)" : "#ffffff",
              padding: "8px",
              minHeight: "40px",
              minWidth: "40px"
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          className="comic-card animate-pop"
          style={{
            position: "absolute",
            top: "100%",
            left: "16px",
            right: "16px",
            marginTop: "8px",
            background: "#ffffff",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 50,
            boxShadow: "var(--ink-shadow-lg)"
          }}
        >
          {/* Mobile Radio Button */}
          <button
            onClick={() => {
              soundFX.pop();
              audioManager.toggleMusic();
            }}
            className="comic-btn"
            style={{
              width: "100%",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: isRadioPlaying ? "var(--pastel-mint)" : "#f8fafc",
              fontSize: "14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>📻</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "800" }}>HAMMY RADIO</span>
            </div>
            <span style={{
              fontSize: "12px",
              fontWeight: "900",
              color: isRadioPlaying ? "#065f46" : "#64748b",
              background: "#ffffff",
              padding: "2px 8px",
              borderRadius: "999px",
              border: "1.5px solid #18181b"
            }}>
              {isRadioPlaying ? "🔊 ON" : "🔇 OFF"}
            </span>
          </button>

          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleNavClick(tab.id)}
              className="comic-btn"
              style={{
                width: "100%",
                justifyContent: "flex-start",
                padding: "10px 14px",
                background: activeTab === tab.id ? "var(--pastel-pink)" : "#f8fafc",
                fontSize: "15px"
              }}
            >
              <span style={{ fontSize: "18px" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Responsive Header CSS */}
      <style>{`
        .desktop-nav {
          display: flex;
        }
        .desktop-bubble {
          display: flex;
        }
        .mobile-menu-btn {
          display: none;
        }

        @media (max-width: 860px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-bubble {
            display: none !important;
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
        }

        @media (max-width: 680px) {
          .hammy-radio-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
