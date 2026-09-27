import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import HammyCam from "./components/HammyCam";
import HammyBrain from "./components/HammyBrain";
import MovesStrip from "./components/MovesStrip";
import MoodCollection from "./components/MoodCollection";
import Footer from "./components/Footer";

import { HamsterVisionEngine } from "./gestures/visionEngine";
import { REACTIONS } from "./hamster/reactions";
import { soundFX } from "./utils/audio";
import confetti from "canvas-confetti";

export default function App() {
  const [activeTab, setActiveTab] = useState("cam");
  const [statusMessage, setStatusMessage] = useState("hamster is putting on pants...");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Vision Engine
  const visionEngineRef = useRef(null);

  // Real-time detection state
  const [detectionData, setDetectionData] = useState(null);
  const [activeGestureId, setActiveGestureId] = useState("default");
  const lastDetectedGestureRef = useRef("default");

  // Collections & Stats stored in localStorage
  const [unlockedMoods, setUnlockedMoods] = useState(() => {
    try {
      const saved = localStorage.getItem("hammy_unlocked");
      return saved ? JSON.parse(saved) : { default: true };
    } catch (e) {
      return { default: true };
    }
  });

  const [secretsFound, setSecretsFound] = useState(() => {
    try {
      const saved = localStorage.getItem("hammy_secrets");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [triedGestures, setTriedGestures] = useState(new Set(["default"]));
  const [gestureCounts, setGestureCounts] = useState({ default: 1 });
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Initialize vision engine on mount
  useEffect(() => {
    const engine = new HamsterVisionEngine();
    visionEngineRef.current = engine;

    engine.init((status) => {
      setStatusMessage(status);
    }).then((success) => {
      if (success) {
        setStatusMessage("hammy is ready!");
      }
    });

    return () => {
      engine.destroy();
    };
  }, []);

  // Session time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebCam frame processing loop when camera is active
  useEffect(() => {
    let animId = null;

    const processLoop = (timestamp) => {
      const engine = visionEngineRef.current;
      const videoEl = document.querySelector("#cam video");

      if (engine && engine.isReady && isCameraActive && videoEl && videoEl.readyState >= 2) {
        const result = engine.processVideoFrame(videoEl, timestamp);
        if (result) {
          setDetectionData(result);
          const gesture = result.stableGesture;
          setActiveGestureId(gesture);

          // Audio: Play scan blip + reaction-specific sound when gesture changes (debounced)
          if (gesture && gesture !== lastDetectedGestureRef.current) {
            lastDetectedGestureRef.current = gesture;
            soundFX.reaction(gesture);
          }

          // Update gesture stats
          setTriedGestures((prev) => new Set([...prev, gesture]));
          setGestureCounts((prev) => ({
            ...prev,
            [gesture]: (prev[gesture] || 0) + 1,
          }));

          // Unlock reaction if new
          setUnlockedMoods((prev) => {
            if (!prev[gesture]) {
              const updated = { ...prev, [gesture]: true };
              localStorage.setItem("hammy_unlocked", JSON.stringify(updated));
              soundFX.unlock();
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
              });
              return updated;
            }
            return prev;
          });
        }
      }

      animId = requestAnimationFrame(processLoop);
    };

    if (isCameraActive) {
      animId = requestAnimationFrame(processLoop);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isCameraActive]);

  // Handle Easter Egg Hamster Click
  const handleSecretClick = (id) => {
    if (!secretsFound.includes(id)) {
      soundFX.secret();
      const updated = [...secretsFound, id];
      setSecretsFound(updated);
      localStorage.setItem("hammy_secrets", JSON.stringify(updated));

      if (updated.length === 5) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
        });
        alert("🎉 YOU FOUND ALL 5 SECRET HAMSTERS! Hammy awards you the certified silly medal! 🐹🏅");
      }
    } else {
      soundFX.squeak();
    }
  };

  // Allow clicking a gesture card to preview/simulate it
  const handleSelectGesture = (id) => {
    setActiveGestureId(id);
    lastDetectedGestureRef.current = id;
    soundFX.reaction(id);
    setDetectionData((prev) => ({
      ...prev,
      rawGesture: id,
      stableGesture: id,
      confidence: 96,
      signals: {
        fingers: [1, 1, 1, 1],
        isPinch: id === "glasses",
        pinchRatio: id === "glasses" ? 0.35 : 0.8,
        faceSignal: 0.35,
      },
      hasFace: true,
      handCount: 1,
    }));

    // Unlock card
    setUnlockedMoods((prev) => {
      if (!prev[id]) {
        const updated = { ...prev, [id]: true };
        localStorage.setItem("hammy_unlocked", JSON.stringify(updated));
        soundFX.unlock();
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
        return updated;
      }
      return prev;
    });

    setTriedGestures((prev) => new Set([...prev, id]));
  };

  // Determine favorite mood based on counts
  let favoriteMood = "Poker Face 😐";
  let maxCount = 0;
  for (const [gid, count] of Object.entries(gestureCounts)) {
    if (count > maxCount && REACTIONS[gid]) {
      maxCount = count;
      favoriteMood = `${REACTIONS[gid].name} ${REACTIONS[gid].icon}`;
    }
  }

  const activeReaction = REACTIONS[activeGestureId] || REACTIONS.default;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSecretClick={handleSecretClick}
      />

      {/* TOP STAGE: HERO + HAMMY CAM + HAMMY BRAIN */}
      <main className="main-top-stage">
        {/* Hero Column */}
        <div className="stage-hero-col">
          <Hero
            onEnterZone={() => {
              const el = document.getElementById("cam");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            onSecretClick={handleSecretClick}
          />
        </div>

        {/* Hammy Cam Dual Panel */}
        <div className="stage-cam-col">
          <HammyCam
            visionEngine={visionEngineRef.current}
            activeReaction={activeReaction}
            detectionData={detectionData}
            isCameraActive={isCameraActive}
            setIsCameraActive={setIsCameraActive}
            cameraError={cameraError}
            setCameraError={setCameraError}
            statusMessage={statusMessage}
          />
        </div>

        {/* Hammy Brain Terminal */}
        <div className="stage-brain-col">
          <HammyBrain
            detectionData={detectionData}
            activeReaction={activeReaction}
            isCameraActive={isCameraActive}
            onSecretClick={handleSecretClick}
          />
        </div>
      </main>

      <style>{`
        .main-top-stage {
          max-width: 1480px;
          margin: 8px auto 16px;
          padding: 0 16px;
          width: 100%;
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(280px, 320px) minmax(500px, 1.4fr) minmax(260px, 300px);
          gap: 16px;
          align-items: stretch;
        }
        .stage-hero-col, .stage-cam-col, .stage-brain-col {
          min-width: 0;
        }

        @media (max-width: 1140px) {
          .main-top-stage {
            grid-template-columns: 1fr 1fr !important;
          }
          .stage-hero-col {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .main-top-stage {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
            padding: 0 12px !important;
          }
        }
      `}</style>

      {/* Tutorial Moves Strip */}
      <MovesStrip
        activeGestureId={activeGestureId}
        onSelectGesture={handleSelectGesture}
      />

      {/* Stamp / Polaroid Mood Collection */}
      <MoodCollection
        unlockedMoods={unlockedMoods}
        setUnlockedMoods={setUnlockedMoods}
        secretCount={secretsFound.length}
        triedGesturesCount={triedGestures.size}
        sessionMinutes={Math.max(1, Math.floor(sessionSeconds / 60))}
        favoriteMood={favoriteMood}
        onSecretClick={handleSecretClick}
      />

      {/* Footer Pink Taskbar */}
      <Footer onSecretClick={handleSecretClick} />
    </div>
  );
}
