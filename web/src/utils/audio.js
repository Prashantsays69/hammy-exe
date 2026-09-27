// HAMMY.EXE Centralized Audio Engine
// Background Radio + Procedural Meme SFX Palette + Music Ducking

const RADIO_AUDIO_PATH = "/audio/milky-just-the-way-you-are-sped-up-official-audio-milky-128k_XfhWGymI.mp3";
const NORMAL_MUSIC_VOLUME = 0.18;
const DUCKED_MUSIC_VOLUME = 0.05;

class HammyAudioManager {
  constructor() {
    this.ctx = null;
    this.musicAudio = null;
    this.isMusicPlaying = false;
    this.isMusicMuted = false;
    this.isMusicStarted = false;
    this.userDisabledRadio = false;
    this.listeners = new Set();

    // Throttling timestamps for spam prevention
    this.lastHoverTime = 0;
    this.lastBrainBlipTime = 0;
    this.lastGestureSoundTime = 0;
    this.lastGestureId = null;
    this.duckTimeout = null;

    // Load radio user preference from localStorage
    try {
      const savedPref = localStorage.getItem("hammy_radio_enabled");
      if (savedPref === "false") {
        this.userDisabledRadio = true;
      }
    } catch (e) {}

    // Initialize audio element
    if (typeof window !== "undefined") {
      this.initAudioElement();
    }
  }

  // Subscribe to radio state changes (for UI toggle syncing)
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn({
          isPlaying: this.isMusicPlaying,
          isMuted: this.isMusicMuted,
          isDisabled: this.userDisabledRadio,
        });
      } catch (e) {}
    });
  }

  // Ensure AudioContext is ready on user gesture
  initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  initAudioElement() {
    if (this.musicAudio) return;
    try {
      this.musicAudio = new Audio(RADIO_AUDIO_PATH);
      this.musicAudio.loop = true;
      this.musicAudio.volume = NORMAL_MUSIC_VOLUME;
      this.musicAudio.preload = "auto";

      this.musicAudio.addEventListener("play", () => {
        this.isMusicPlaying = true;
        this.notify();
      });

      this.musicAudio.addEventListener("pause", () => {
        this.isMusicPlaying = false;
        this.notify();
      });

      this.musicAudio.addEventListener("ended", () => {
        // Fallback seamless loop if browser doesn't loop reliably
        if (this.musicAudio && !this.userDisabledRadio) {
          this.musicAudio.currentTime = 0;
          this.musicAudio.play().catch(() => {});
        }
      });
    } catch (e) {
      console.warn("Failed to initialize background music audio:", e);
    }
  }

  // Triggered on deliberate user interaction (ENTER THE HAMSTER ZONE, LET'S GO, START WEBCAM)
  startMusicOnInteraction() {
    if (this.userDisabledRadio) {
      // User explicitly turned off radio in localStorage, respect preference
      return;
    }
    this.initContext();
    if (!this.musicAudio) {
      this.initAudioElement();
    }
    if (this.musicAudio && !this.isMusicPlaying) {
      this.musicAudio.volume = NORMAL_MUSIC_VOLUME;
      this.musicAudio.play().then(() => {
        this.isMusicStarted = true;
        this.isMusicPlaying = true;
        this.notify();
      }).catch((e) => {
        // Autoplay policy or user hasn't clicked yet
      });
    }
  }

  // Toggle HAMMY RADIO ON / OFF
  toggleMusic() {
    this.initContext();
    if (!this.musicAudio) {
      this.initAudioElement();
    }

    if (this.isMusicPlaying) {
      // Turn OFF
      this.userDisabledRadio = true;
      try {
        localStorage.setItem("hammy_radio_enabled", "false");
      } catch (e) {}
      if (this.musicAudio) {
        this.musicAudio.pause();
      }
      this.isMusicPlaying = false;
      this.notify();
    } else {
      // Turn ON
      this.userDisabledRadio = false;
      try {
        localStorage.setItem("hammy_radio_enabled", "true");
      } catch (e) {}
      if (this.musicAudio) {
        this.musicAudio.volume = NORMAL_MUSIC_VOLUME;
        this.musicAudio.play().catch(() => {});
      }
      this.isMusicStarted = true;
      this.isMusicPlaying = true;
      this.notify();
    }
  }

  // Music Ducking during important reactions / unlocks
  duckMusic(durationMs = 550) {
    if (!this.musicAudio || !this.isMusicPlaying || this.userDisabledRadio) return;

    if (this.duckTimeout) {
      clearTimeout(this.duckTimeout);
      this.duckTimeout = null;
    }

    // Smoothly step volume down
    const startVol = this.musicAudio.volume;
    const targetVol = DUCKED_MUSIC_VOLUME;
    const steps = 6;
    const stepDuration = 15;
    let currentStep = 0;

    const duckInterval = setInterval(() => {
      currentStep++;
      if (this.musicAudio) {
        this.musicAudio.volume = Math.max(
          targetVol,
          startVol - ((startVol - targetVol) * (currentStep / steps))
        );
      }
      if (currentStep >= steps) {
        clearInterval(duckInterval);
      }
    }, stepDuration);

    // Schedule restoration after duration
    this.duckTimeout = setTimeout(() => {
      this.restoreMusic();
    }, durationMs);
  }

  restoreMusic() {
    if (!this.musicAudio || !this.isMusicPlaying || this.userDisabledRadio) return;
    const startVol = this.musicAudio.volume;
    const targetVol = NORMAL_MUSIC_VOLUME;
    const steps = 8;
    const stepDuration = 20;
    let currentStep = 0;

    const restoreInterval = setInterval(() => {
      currentStep++;
      if (this.musicAudio) {
        this.musicAudio.volume = Math.min(
          targetVol,
          startVol + ((targetVol - startVol) * (currentStep / steps))
        );
      }
      if (currentStep >= steps) {
        clearInterval(restoreInterval);
        if (this.musicAudio) this.musicAudio.volume = NORMAL_MUSIC_VOLUME;
      }
    }, stepDuration);
  }

  // ==========================================
  // PROCEDURAL WEB AUDIO SFX PALETTE
  // ==========================================

  // Safe AudioContext getter
  getSafeContext() {
    this.initContext();
    return this.ctx;
  }

  // 1. Normal button click: tiny plastic/pop click
  playBtnClick() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // 2. Primary CTA: slightly bigger playful pop + tiny sparkle
  playBtnCta() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Main pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);

      // Sparkle ping
      const spark = ctx.createOscillator();
      const sparkGain = ctx.createGain();
      spark.type = "sine";
      spark.frequency.setValueAtTime(1480, now + 0.04);
      spark.frequency.exponentialRampToValueAtTime(2200, now + 0.14);
      sparkGain.gain.setValueAtTime(0.12, now + 0.04);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      spark.connect(sparkGain);
      sparkGain.connect(ctx.destination);
      spark.start(now + 0.04);
      spark.stop(now + 0.16);
    } catch (e) {}
  }

  // 3. Hover: extremely subtle squeak/pop (throttled)
  playBtnHover() {
    const nowMs = Date.now();
    if (nowMs - this.lastHoverTime < 180) return; // avoid annoying spam
    this.lastHoverTime = nowMs;

    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1150, now);
      osc.frequency.exponentialRampToValueAtTime(1380, now + 0.035);

      gain.gain.setValueAtTime(0.04, now); // very soft
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // 4. Camera Startup: cute retro camera startup sound
  playCamStart() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Rising whirr
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);

      // Startup chirp click at end
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = "sine";
      click.frequency.setValueAtTime(1200, now + 0.2);
      click.frequency.exponentialRampToValueAtTime(1800, now + 0.26);
      clickGain.gain.setValueAtTime(0.2, now + 0.2);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      click.start(now + 0.2);
      click.stop(now + 0.28);
    } catch (e) {}
  }

  // 5. Camera Ready: tiny confirmation chirp
  playCamReady() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [880, 1320]; // A5 -> E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.09);
      });
    } catch (e) {}
  }

  // 6. Camera Stop: tiny power-down chirp
  playCamStop() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  // 7. Camera Error: soft comedic error/bonk
  playCamError() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  // 8. Hammy Brain Computer Blip (throttled, soft retro terminal blip)
  playBrainBlip() {
    const nowMs = Date.now();
    if (nowMs - this.lastBrainBlipTime < 1000) return;
    this.lastBrainBlipTime = nowMs;

    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1046, now);
      osc.frequency.setValueAtTime(1318, now + 0.025);
      gain.gain.setValueAtTime(0.04, now); // quiet
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // 9. Hammy Brain Verdict: short processing-complete sound
  playBrainVerdict() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.05;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch (e) {}
  }

  // 10. Scan blip on newly recognized gesture
  playScanBlip() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(1900, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // 11. New Mood Unlocked: tiny click -> sparkle -> pop -> squeak (<1s)
  playUnlock() {
    this.duckMusic(800);
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // 1. Initial click
      const click = ctx.createOscillator();
      const clickG = ctx.createGain();
      click.type = "triangle";
      click.frequency.setValueAtTime(900, now);
      click.frequency.exponentialRampToValueAtTime(200, now + 0.03);
      clickG.gain.setValueAtTime(0.15, now);
      clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      click.connect(clickG);
      clickG.connect(ctx.destination);
      click.start(now);
      click.stop(now + 0.035);

      // 2. Sparkle chime sequence
      const chimeNotes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
      chimeNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + 0.05 + idx * 0.06;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });

      // 3. Satisfying pop
      const popStart = now + 0.32;
      const popOsc = ctx.createOscillator();
      const popG = ctx.createGain();
      popOsc.type = "triangle";
      popOsc.frequency.setValueAtTime(420, popStart);
      popOsc.frequency.exponentialRampToValueAtTime(850, popStart + 0.06);
      popG.gain.setValueAtTime(0.2, popStart);
      popG.gain.exponentialRampToValueAtTime(0.01, popStart + 0.08);
      popOsc.connect(popG);
      popG.connect(ctx.destination);
      popOsc.start(popStart);
      popOsc.stop(popStart + 0.08);

      // 4. Tiny hamster squeak
      const squeakStart = now + 0.44;
      const squeakOsc = ctx.createOscillator();
      const squeakG = ctx.createGain();
      squeakOsc.type = "sine";
      squeakOsc.frequency.setValueAtTime(1250, squeakStart);
      squeakOsc.frequency.exponentialRampToValueAtTime(1850, squeakStart + 0.07);
      squeakOsc.frequency.exponentialRampToValueAtTime(1300, squeakStart + 0.16);
      squeakG.gain.setValueAtTime(0.18, squeakStart);
      squeakG.gain.exponentialRampToValueAtTime(0.001, squeakStart + 0.18);
      squeakOsc.connect(squeakG);
      squeakG.connect(ctx.destination);
      squeakOsc.start(squeakStart);
      squeakOsc.stop(squeakStart + 0.18);
    } catch (e) {}
  }

  // 12. Selecting already unlocked hamster in collection
  playSelectCard() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {}
  }

  // 13. Secret Hamster Sound (discovery + sparkle + celebratory jingle)
  playSecretFound() {
    this.duckMusic(900);
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Sparkly ascending discovery flourish
      const secretNotes = [659.25, 830.61, 987.77, 1318.51, 1661.22]; // E5, G#5, B5, E6, G#6
      secretNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.06;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });

      // Joyful celebratory double squeak
      [0.36, 0.48].forEach((offset) => {
        const sq = ctx.createOscillator();
        const sqG = ctx.createGain();
        const start = now + offset;
        sq.type = "sine";
        sq.frequency.setValueAtTime(1400, start);
        sq.frequency.exponentialRampToValueAtTime(2100, start + 0.05);
        sq.frequency.exponentialRampToValueAtTime(1500, start + 0.1);
        sqG.gain.setValueAtTime(0.16, start);
        sqG.gain.exponentialRampToValueAtTime(0.001, start + 0.11);
        sq.connect(sqG);
        sqG.connect(ctx.destination);
        sq.start(start);
        sq.stop(start + 0.11);
      });
    } catch (e) {}
  }

  // Classic squeak for easter eggs
  playSqueak() {
    const ctx = this.getSafeContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(1850, now + 0.07);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  // ==========================================
  // 14. HAMSTER REACTION-SPECIFIC SFX (0.1–0.7s)
  // ==========================================
  playReactionSound(reactionId) {
    // Debounce & prevent spamming the exact same gesture sound
    const nowMs = Date.now();
    if (this.lastGestureId === reactionId && nowMs - this.lastGestureSoundTime < 800) {
      return;
    }
    this.lastGestureId = reactionId;
    this.lastGestureSoundTime = nowMs;

    const ctx = this.getSafeContext();
    if (!ctx) return;

    // First: tiny scan blip
    this.playScanBlip();

    // Duck music briefly so reaction sound cuts through cleanly
    this.duckMusic(450);

    const now = ctx.currentTime + 0.04; // small offset right after scan blip

    try {
      switch (reactionId) {
        // 1. THUMBS UP: tiny cheerful pop/chime
        case "thumbs_up": {
          const notes = [1046.5, 1567.98]; // C6 -> G6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.08;
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.22, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.2);
          });
          break;
        }

        // 2. THUMBS DOWN: short comedic descending bonk
        case "thumbs_down": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);
          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }

        // 3. LOLLIPOP JOY: candy-like sparkle/pop
        case "fist_by_head": {
          const sparkleFreqs = [1174.66, 1567.98, 2093.0];
          sparkleFreqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.06;
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.16);
          });
          // Bubble pop
          const pop = ctx.createOscillator();
          const popG = ctx.createGain();
          pop.type = "triangle";
          pop.frequency.setValueAtTime(450, now + 0.18);
          pop.frequency.exponentialRampToValueAtTime(900, now + 0.25);
          popG.gain.setValueAtTime(0.18, now + 0.18);
          popG.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
          pop.connect(popG);
          popG.connect(ctx.destination);
          pop.start(now + 0.18);
          pop.stop(now + 0.27);
          break;
        }

        // 4. SHY HAMMY: tiny embarrassed squeak
        case "shy": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(1750, now + 0.08);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }

        // 5. SAD HAMMY: tiny descending comedic tone
        case "sad": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(310, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.32);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        // 6. SWOLE/BICEP: exaggerated tiny flex/impact sound
        case "bicep": {
          // Low thud
          const thud = ctx.createOscillator();
          const thudG = ctx.createGain();
          thud.type = "triangle";
          thud.frequency.setValueAtTime(150, now);
          thud.frequency.exponentialRampToValueAtTime(50, now + 0.12);
          thudG.gain.setValueAtTime(0.28, now);
          thudG.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
          thud.connect(thudG);
          thudG.connect(ctx.destination);
          thud.start(now);
          thud.stop(now + 0.14);

          // Cartoon flex spring boing
          const boing = ctx.createOscillator();
          const boingG = ctx.createGain();
          boing.type = "sawtooth";
          boing.frequency.setValueAtTime(260, now + 0.05);
          boing.frequency.exponentialRampToValueAtTime(720, now + 0.24);
          boingG.gain.setValueAtTime(0.18, now + 0.05);
          boingG.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          boing.connect(boingG);
          boingG.connect(ctx.destination);
          boing.start(now + 0.05);
          boing.stop(now + 0.26);
          break;
        }

        // 7. SHH: very short soft shushing cue
        case "finger_mouth": {
          // Bandpass noise simulation
          const bufferSize = ctx.sampleRate * 0.18;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(2200, now);
          filter.Q.setValueAtTime(3.0, now);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          noise.start(now);
          noise.stop(now + 0.18);
          break;
        }

        // 8. NERD: tiny quirky "idea" blip
        case "nerd": {
          const notes = [932.33, 1479.98]; // Bb5 -> F#6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.07;
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.18, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.1);
          });
          break;
        }

        // 9. CROSS ARMS: dry comedic "nope" bonk
        case "cross_arms": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        }

        // 10. GLASSES: quirky spectacle adjust ping
        case "glasses": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(1600, now);
          osc.frequency.exponentialRampToValueAtTime(2400, now + 0.06);
          osc.frequency.exponentialRampToValueAtTime(1900, now + 0.14);
          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        // 11. THINKING: tiny quirky thinking blip
        case "thinking": {
          const notes = [620, 840, 720];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.07;
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.14, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.08);
          });
          break;
        }

        // 12. HUG: soft warm pop
        case "hug": {
          [330, 440].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.18);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
          });
          break;
        }

        // 13. TRUCK: very short toy-truck/car horn sound
        case "two_hands": {
          [440, 554.37].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.setValueAtTime(0.12, now + 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            // Double toot!
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = "sawtooth";
            osc2.frequency.setValueAtTime(freq, now + 0.12);
            gain2.gain.setValueAtTime(0.12, now + 0.12);
            gain2.gain.setValueAtTime(0.12, now + 0.22);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.24);
          });
          break;
        }

        // 14. SIDE-EYE: tiny suspicious/comedic slide sound
        case "side_eye": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(360, now);
          osc.frequency.exponentialRampToValueAtTime(560, now + 0.18);
          osc.frequency.exponentialRampToValueAtTime(480, now + 0.25);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.28);
          break;
        }

        // 15. POKER FACE / DEFAULT: awkward deadpan plop/bonk
        case "default":
        default: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        }
      }
    } catch (e) {}
  }
}

// Global Singleton Instance
export const audioManager = new HammyAudioManager();

// Backward compatibility bridge for existing soundFX calls
export const soundFX = {
  pop: () => audioManager.playBtnClick(),
  squeak: () => audioManager.playSqueak(),
  unlock: () => audioManager.playUnlock(),
  cta: () => audioManager.playBtnCta(),
  hover: () => audioManager.playBtnHover(),
  reaction: (id) => audioManager.playReactionSound(id),
  camStart: () => audioManager.playCamStart(),
  camReady: () => audioManager.playCamReady(),
  camStop: () => audioManager.playCamStop(),
  camError: () => audioManager.playCamError(),
  brainBlip: () => audioManager.playBrainBlip(),
  brainVerdict: () => audioManager.playBrainVerdict(),
  selectCard: () => audioManager.playSelectCard(),
  secret: () => audioManager.playSecretFound(),
};
