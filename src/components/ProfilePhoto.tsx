"use client";

import { useState } from "react";

/** Photo with a graceful gradient + initial fallback if the image fails to load. */
export function ProfilePhoto({
  src,
  name,
  className = "",
}: {
  src: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-rose-300 to-violet-400 text-5xl font-bold text-white ${className}`}
        role="img"
        aria-label={name}
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    // Plain <img>: remote placeholder avatars, no need for the image optimiser here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      draggable={false}
      onError={() => setFailed(true)}
      className={`select-none object-cover ${className}`}
    />
  );
}
