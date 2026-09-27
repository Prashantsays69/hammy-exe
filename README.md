# HAMMY.EXE & Hamster Reaction Cam

An interactive, AI-powered webcam playground that reacts in real time with meme hamster expressions matching your facial gestures, hand poses, and head posture.

> **"your webcam is now hamster-controlled."**

---

## 🐹 HAMMY.EXE Web Application (React + Vite + MediaPipe)

The web app is located in `web/` and runs entirely in the browser using client-side MediaPipe Tasks Vision. **No Python backend is required for the web version.**

### Quick Start (Web App)

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Web App Features

- **Exact Mockup Visual Fidelity**:
  - Warm cream background, pastel pink, soft yellow, lavender, and mint accents.
  - Chunky ink borders (`2.5px solid #18181b`) and retro comic drop-shadows.
  - Playful typography with Google Fonts (*Fredoka*, *Gaegu*, *Patrick Hand*, *Fira Code*).
- **15 Distinct Hamster Artwork Illustrations**:
  - Custom white blob meme hamster SVG art for all 15 poses (Lollipop Joy, Happy Hammy, Disappointed, Discord Mod Glasses, Shh, Nerd, Swole Bicep, Crossed Arms, Shy, Thinking, Hug, Sad, Truck Driver, Side-Eye, Poker-Face).
  - Toggle between **Cartoon Doodle Hamster** and **Original Meme Photo**.
- **Dual-Stage Interactive Hammy Cam**:
  - Live webcam stream with neon skeleton landmarks and face tracking.
  - Yellow telemetry HUD (FPS, Head Yaw/Pitch, Hands count, Pinch ratio, Signals, Raw detector -> mapped).
  - Controls for mirroring, skeleton toggle, and camera permissions.
- **HAMMY BRAIN.exe**:
  - Retro CRT terminal window dynamically displaying face/hand detection, active gesture, confidence %, reaction, and funny randomized verdicts.
- **"TEACH HAMMY YOUR MOVES!"**:
  - 15-gesture interactive tutorial strip with active glowing highlight and animation. Clicking any card simulates/tests the reaction.
- **"HAMMY'S MOOD COLLECTION"**:
  - Taped polaroid stamp album tracking unlocked moods saved in `localStorage`.
  - Dynamic user stats: reactions unlocked, session time, gestures tried, favorite mood.
- **Hidden Easter Eggs**:
  - 5 secret hamsters hidden around the site with Web Audio squeak sounds and a celebratory unlock modal when all 5 are discovered.

---

## 🐍 Python OpenCV Desktop Application

- **Real-Time Multi-Modal Detection**: Leverages Google MediaPipe (Hand, Face, and Pose landmarkers) to detect intricate gestures simultaneously.
- **15 Expressive Reactions**: From classic thumbs-up to Discord Mod glasses, chin-thinking, bicep flexing, and shy cheek holding.
- **Rock-Solid Temporal Smoothing**: Built-in majority-vote temporal filter prevents glitchy jitter and flickering between expressions.
- **High-Polish Streamer UI**:
  - Dark-glass studio theme with pulsing live indicator and dynamic reaction badge pills.
  - Dual-stage layout: Synchronized side-by-side comparison between meme card and live camera.
  - Interactive neon hand skeleton overlay.
  - Toggleable telemetry HUD displaying real-time head yaw/pitch, finger states, pinch ratios, and proximity metrics.
- **Graceful Camera & Error Handling**:
  - Auto-reconnection and device cycling.
  - Beautiful animated test-card fallback when no camera is connected or permissions are denied.
  - Safe offline mode with procedural cartoon hamster generation if meme images or network are unavailable.
  - Pause/Resume and Mirror mode toggles.
- **Modular Architecture**: Clean, production-ready codebase with separated configuration, acquisition, classification, rendering, and asset lifecycle.

---

## Project Structure

```text
hamstertwin/
├── assets/
│   ├── images/              # Hamster reaction meme assets (auto-downloaded)
│   └── models/              # MediaPipe vision task models (auto-downloaded)
├── hamster_cam/
│   ├── __init__.py          # Package initialization
│   ├── app.py               # Main application lifecycle & event loop
│   ├── assets.py            # Model/asset manager & fallback synthesizer
│   ├── camera.py            # Hardware webcam manager with cropping & test pattern
│   ├── config.py            # Central configuration, palette, and thresholds
│   ├── detector.py          # Geometric classifier & temporal voting engine
│   └── renderer.py          # High-polish OpenCV dual-stage UI renderer & HUD
├── download_assets.py       # Standalone asset pre-downloader utility
├── main.py                  # CLI application entry point
├── test_cam.py              # Automated test suite (10 unit tests)
├── requirements.txt         # Python dependencies
├── run.bat                  # One-click Windows runner
├── run.sh                   # One-click macOS / Linux runner
└── README.md                # Project documentation
```

---

## Installation

### Prerequisites
- Python 3.10 to 3.13
- A webcam (optional; application automatically provides an interactive test pattern if no webcam is present)

### 1. Clone or Open the Repository
```bash
cd hamstertwin
```

### 2. Create and Activate Virtual Environment

**Windows (PowerShell / Command Prompt):**
```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## How to Run

### Quick Start
All required models and meme assets are automatically downloaded on first launch.

**On Windows:**
```powershell
python main.py
```
*(Or double-click `run.bat`)*

**On macOS / Linux:**
```bash
python3 main.py
```
*(Or run `./run.sh`)*

### CLI Options

| Argument | Description | Default |
|---|---|---|
| `--camera <id>` | Specify webcam device index | `0` |
| `--no-hud` | Launch with the telemetry HUD hidden | Disabled |
| `--download-assets` | Pre-download all models & images and exit | Disabled |

**Example:**
```bash
python main.py --camera 1 --no-hud
```

---

## Controls

All controls can be toggled in real time within the application window:

| Key | Action |
|---|---|
| `Q` or `ESC` | Exit application cleanly |
| `D` | Toggle Telemetry HUD / Debug Overlay on & off |
| `S` | Pause / Resume webcam acquisition |
| `M` | Toggle horizontal mirror mode |
| `R` | Reconnect / cycle through available camera devices |
| Window `[X]` | Graceful shutdown and resource cleanup |

---

## Supported Gestures & Reactions

| User Gesture / Expression | Hamster Reaction | Trigger Condition |
|---|---|---|
| **Neutral / No Pose** | Poker Face | Default idle state |
| **Thumbs Up** | Approved! | Thumb pointed up away from head |
| **Thumbs Down** | Disapproved | Thumb pointed downward away from head |
| **Pinch Near Face** | Discord Mod | Thumb + index touching near eye/face |
| **Fist Beside Head** | Lollipop Joy | Curled hand or fist held beside cheek |
| **Finger Near Mouth** | Shh / Quiet | Pointer fingertip placed at lips |
| **Index Finger Up** | Actually... (Nerd) | Pointer finger up, away from mouth |
| **Hands on Cheeks** | Shy Hamster | One hand resting on each cheek |
| **Hands Under Chin** | Contemplating | Both hands clasped under chin |
| **Hands at Chest** | Plushie Hug | Both hands clasped low at chest |
| **Crossed Arms** | Crossed Arms | Wrists tucked close at chest level |
| **Bicep Flex** | Bicep Flex | Bent elbow, wrist raised above shoulder |
| **Two Hands Raised** | Arms Out! | Both open hands visible in frame |
| **Head Tilted Down** | Melancholy (Sad) | Head pitch tilted downward |
| **Head Turned Sideways** | Side Eye | Head yaw rotated left or right |

---

## Testing

Run the automated test suite without needing physical camera hardware:

```bash
python test_cam.py
```

Tests cover:
- Camera manager initialization, pause/mirror state, and synthetic test-pattern generation
- Geometric heuristics (finger extension, hand shapes, elbow angles, head pitch/yaw)
- Temporal voting buffer stabilization
- Full dual-stage canvas composition and HUD rendering
- Fallback hamster asset synthesizer
