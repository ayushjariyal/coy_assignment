"use client";

import { useCallback, useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { Direction, PublicProfile } from "@/lib/types";
import { PinIcon } from "./Icons";
import { ProfilePhoto } from "./ProfilePhoto";

const SWIPE_DISTANCE = 110; // px dragged before release counts as a swipe
const SWIPE_VELOCITY = 600; // px/s flick that counts as a swipe even if short
const FLY_OUT_X = 650;

interface Props {
  profile: PublicProfile;
  isTop: boolean;
  /** Set by the parent when a button/keyboard swipe is requested. */
  command: Direction | null;
  onSwiped: (profile: PublicProfile, direction: Direction) => void;
}

export function SwipeCard({ profile, isTop, command, onSwiped }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-16, 0, 16]);
  const likeOpacity = useTransform(x, [15, SWIPE_DISTANCE], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_DISTANCE, -15], [1, 0]);
  const leaving = useRef(false);

  const flyOut = useCallback(
    async (direction: Direction) => {
      if (leaving.current) return;
      leaving.current = true;
      await animate(x, direction === "like" ? FLY_OUT_X : -FLY_OUT_X, {
        duration: 0.32,
        ease: [0.4, 0, 1, 1],
      });
      onSwiped(profile, direction);
    },
    [onSwiped, profile, x],
  );

  useEffect(() => {
    if (isTop && command) void flyOut(command);
  }, [command, isTop, flyOut]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) void flyOut("like");
    else if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) void flyOut("pass");
    else animate(x, 0, { type: "spring", stiffness: 500, damping: 32 });
  };

  const place = profile.college ? `${profile.college} · ${profile.city}` : profile.city;

  return (
    <motion.article
      aria-label={`${profile.name}, ${profile.age}`}
      aria-hidden={!isTop}
      className={`absolute inset-0 overflow-hidden rounded-3xl bg-neutral-200 shadow-xl ${
        isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      }`}
      style={{ x, rotate, zIndex: isTop ? 2 : 1 }}
      initial={false}
      animate={isTop ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.94, y: 14, opacity: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      drag={isTop ? "x" : false}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
    >
      <ProfilePhoto src={profile.photo} name={profile.name} className="absolute inset-0 h-full w-full" />

      {/* Swipe feedback stamps */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 text-3xl font-extrabold tracking-wider text-emerald-400"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-lg border-4 border-rose-500 px-3 py-1 text-3xl font-extrabold tracking-wider text-rose-500"
      >
        NOPE
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-5 pt-24 text-white">
        <h2 className="text-3xl font-bold">
          {profile.name} <span className="font-normal">{profile.age}</span>
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
          <PinIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{place}</span>
        </p>
        <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-white/95">{profile.bio}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Interests">
          {profile.interests.slice(0, 4).map((interest) => (
            <li
              key={interest}
              className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm"
            >
              {interest}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}
