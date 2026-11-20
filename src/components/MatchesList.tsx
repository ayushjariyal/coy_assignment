"use client";

import { motion } from "framer-motion";
import type { MatchView } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { HeartIcon, LockIcon } from "./Icons";
import { ProfilePhoto } from "./ProfilePhoto";

interface Props {
  matches: MatchView[] | null;
  error: string | null;
  onRetry: () => void;
  onStartSwiping: () => void;
}

export function MatchesList({ matches, error, onRetry, onStartSwiping }: Props) {
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-neutral-600">{error}</p>
        <button onClick={onRetry} className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white">
          Try again
        </button>
      </div>
    );
  }

  if (!matches) {
    return (
      <div className="grid grid-cols-2 gap-3 overflow-y-auto px-4 pb-4" aria-busy="true" aria-label="Loading matches">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <HeartIcon className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold">No matches yet</h2>
        <p className="mt-2 text-sm text-neutral-500">
          When someone you like likes you back, they&apos;ll show up here.
        </p>
        <PrivacyNote />
        <button
          onClick={onStartSwiping}
          className="mt-6 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-md"
        >
          Start swiping
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <p className="mb-3 text-sm text-neutral-500">
        {matches.length} mutual {matches.length === 1 ? "match" : "matches"}
      </p>
      <ul className="grid grid-cols-2 gap-3">
        {matches.map((m, i) => (
          <motion.li
            key={m.profile.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200 shadow"
          >
            <ProfilePhoto src={m.profile.photo} name={m.profile.name} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-white">
              <p className="font-semibold leading-tight">
                {m.profile.name}, {m.profile.age}
              </p>
              <p className="truncate text-xs text-white/80">{m.profile.college ?? m.profile.city}</p>
              <p className="mt-0.5 text-[11px] text-white/70">Matched {timeAgo(m.matchedAt)}</p>
            </div>
          </motion.li>
        ))}
      </ul>
      <PrivacyNote />
    </div>
  );
}

function PrivacyNote() {
  return (
    <p className="mx-auto mt-6 flex max-w-xs items-start justify-center gap-1.5 text-center text-xs text-neutral-400">
      <LockIcon className="mt-px h-3.5 w-3.5 shrink-0" />
      Coy never shows who liked you unless the feeling is mutual.
    </p>
  );
}
