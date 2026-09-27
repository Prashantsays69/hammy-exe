import React from "react";
import { REACTIONS } from "./reactions";

// AUTHENTIC WHITE MEME HAMSTER ARTWORK
// Directly uses the authentic rough hand-drawn white meme hamster stickers matching the Pinterest reference!
// Every reaction pose is distinct, consistent, and drawn by the same creator.

export function HamsterArt({ type = "default", className = "", style = {} }) {
  const meta = REACTIONS[type] || REACTIONS.default;
  const imageSrc = meta?.image || "/images/plain_hamster.png";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <img
        src={imageSrc}
        alt={meta?.name || "Meme Hamster"}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          filter: "drop-shadow(2px 2px 0px rgba(24, 24, 27, 0.15))",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// Random decorative meme hamster stickers from the reference
export function StickerHamster({ pose = "waving", size = 50, className = "", style = {} }) {
  let imageSrc = "/images/plain_hamster.png";

  switch (pose) {
    case "sleeping":
      imageSrc = "/images/pajama_hamster.png";
      break;
    case "peeking":
    case "staring":
      imageSrc = "/images/magnifying_hamster.png";
      break;
    case "dancing":
    case "celebrating":
    case "screaming":
      imageSrc = "/images/screaming_hamster.png";
      break;
    case "smug":
      imageSrc = "/images/smug_hamster.png";
      break;
    case "thankyou":
      imageSrc = "/images/thankyou_hamster.png";
      break;
    case "thumbs_up":
      imageSrc = "/images/thumbs_up_sticker.png";
      break;
    case "thinking":
      imageSrc = "/images/thinking_sticker.png";
      break;
    case "waving":
    default:
      imageSrc = "/images/plain_hamster.png";
      break;
  }

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={imageSrc}
        alt="Meme Hamster Sticker"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          filter: "drop-shadow(2px 2px 0px rgba(24, 24, 27, 0.2))",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
