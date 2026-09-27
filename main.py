import argparse
import logging
import sys

from hamster_cam.app import HamsterCamApp
from hamster_cam.assets import ensure_models, load_reaction_images


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def main():
    setup_logging()
    parser = argparse.ArgumentParser(
        description="Hamster Reaction Cam — Interactive AI-powered webcam meme reaction application."
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Webcam device index (default: 0).",
    )
    parser.add_argument(
        "--no-hud",
        action="store_true",
        help="Start with the telemetry HUD hidden.",
    )
    parser.add_argument(
        "--download-assets",
        action="store_true",
        help="Pre-download all models and assets without launching the camera.",
    )

    args = parser.parse_args()

    if args.download_assets:
        print("Pre-downloading MediaPipe vision models and hamster memes...")
        ensure_models()
        load_reaction_images()
        print("All assets downloaded successfully.")
        return 0

    app = HamsterCamApp(
        camera_id=args.camera,
        show_hud=not args.no_hud,
    )
    app.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
