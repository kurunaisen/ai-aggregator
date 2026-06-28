"use client";

import { useRef } from "react";

type ToolPreviewVideoProps = {
  src: string;
  label: string;
};

export function ToolPreviewVideo({ src, label }: ToolPreviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleMouseEnter() {
    const video = videoRef.current;
    if (!video) return;
    void video.play();
  }

  function handleMouseLeave() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  return (
    <video
      ref={videoRef}
      className="aspect-video w-full rounded-xl border divider-metallic bg-black/40 object-cover"
      src={src}
      aria-label={label}
      muted
      loop
      playsInline
      preload="metadata"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
