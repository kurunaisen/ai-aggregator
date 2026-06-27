"use client";

import { useState } from "react";
import { resolveToolLogoUrl } from "@/lib/tools/logo";

type ToolLogoProps = {
  name: string;
  website: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  colorClass?: string;
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 rounded-lg text-xs",
  md: "h-11 w-11 rounded-xl text-sm",
  lg: "h-16 w-16 rounded-2xl text-xl",
};

export function ToolLogo({
  name,
  website,
  logoUrl,
  size = "md",
  colorClass = "from-silver/15 to-white/5 text-silver",
  className = "",
}: ToolLogoProps) {
  const [failed, setFailed] = useState(false);
  const src = resolveToolLogoUrl({ logoUrl, website });
  const initial = name.charAt(0).toUpperCase();
  const boxClass = `${sizeClasses[size]} ${className}`;

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br font-bold ring-1 ring-white/10 ${colorClass} ${boxClass}`}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-black/50 ring-1 ring-white/10 ${boxClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size === "lg" ? 64 : size === "sm" ? 36 : 44}
        height={size === "lg" ? 64 : size === "sm" ? 36 : 44}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
