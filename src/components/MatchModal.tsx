"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MatchView } from "@/lib/types";
import { HeartIcon } from "./Icons";
import { ProfilePhoto } from "./ProfilePhoto";

interface Props {
  match: MatchView | null;
  onClose: () => void;
  onViewMatches: () => void;
}

export function MatchModal({ match, onClose, onViewMatches }: Props) {
  const keepSwipingRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!match) return;
    keepSwipingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [match, onClose]);

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          key={match.profile.id}
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-title"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/95 via-fuchsia-500/95 to-violet-600/95 backdrop-blur-sm" />

          {/* Floating hearts */}
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute bottom-0 text-white/40"
              style={{ left: `${8 + i * 9}%` }}
              initial={{ y: 40, opacity: 0, scale: 0.6 }}
              animate={{ y: -700, opacity: [0, 1, 0], scale: 1 }}
              transition={{ duration: 3 + (i % 3), delay: i * 0.15, ease: "easeOut" }}
            >
              <HeartIcon className="h-6 w-6" fill="currentColor" stroke="none" />
            </motion.span>
          ))}

          <div className="relative mx-auto flex w-full max-w-md flex-col items-center px-8 text-center text-white">
            <motion.h2
              id="match-title"
              className="text-5xl font-extrabold italic tracking-tight drop-shadow"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
            >
              It&apos;s a match!
            </motion.h2>
            <p className="mt-3 text-base text-white/90">
              You and {match.profile.name} like each other.
            </p>

            <div className="mt-10 flex items-center">
              <motion.div
                initial={{ x: -80, rotate: -20, opacity: 0 }}
                animate={{ x: 12, rotate: -8, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.25 }}
                className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-amber-300 to-rose-400 text-2xl font-bold shadow-2xl"
                aria-label="You"
              >
                You
              </motion.div>
              <motion.div
                initial={{ x: 80, rotate: 20, opacity: 0 }}
                animate={{ x: -12, rotate: 8, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.25 }}
                className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-2xl"
              >
                <ProfilePhoto src={match.profile.photo} name={match.profile.name} className="h-full w-full" />
              </motion.div>
            </div>

            <div className="mt-12 flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={onViewMatches}
                className="rounded-full bg-white py-3.5 font-semibold text-rose-500 shadow-lg transition active:scale-[0.98]"
              >
                View matches
              </button>
              <button
                ref={keepSwipingRef}
                type="button"
                onClick={onClose}
                className="rounded-full border-2 border-white/80 py-3 font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
              >
                Keep swiping
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
