"""
Utility script to pre-download MediaPipe task models and hamster reaction meme images.
"""
import logging
import sys

from hamster_cam.assets import ensure_models, load_reaction_images


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    print("=" * 60)
    print(" Hamster Reaction Cam — Asset Pre-Downloader")
    print("=" * 60)

    print("\n1. Downloading MediaPipe Vision Task Models...")
    models_ok = ensure_models()
    if models_ok:
        print("   [OK] Hand, Face, and Pose landmark models are ready.")
    else:
        print("   [WARN] Some models could not be fetched; fallback modes enabled.")

    print("\n2. Downloading Hamster Reaction Meme Images...")
    images = load_reaction_images()
    print(f"   [OK] Loaded {len(images)} reaction meme assets.")

    print("\n[SUCCESS] Setup complete! You can now run 'python main.py'.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
