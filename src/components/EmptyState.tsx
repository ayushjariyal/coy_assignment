"use client";

import { motion } from "framer-motion";
import { SparkleIcon } from "./Icons";

interface Props {
  onViewMatches: () => void;
  onReset: () => void;
  resetting: boolean;
}

export function EmptyState({ onViewMatches, onReset, resetting }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-1 flex-col items-center justify-center px-8 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-violet-100 text-rose-500">
        <SparkleIcon className="h-10 w-10" />
      </div>
      <h2 className="mt-5 text-2xl font-bold">You&apos;re all caught up</h2>
      <p className="mt-2 text-sm text-neutral-500">
        You&apos;ve seen everyone for now. Check back later for new people.
      </p>
      <button
        onClick={onViewMatches}
        className="mt-6 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.98]"
      >
        See your matches
      </button>
      <button
        onClick={onReset}
        disabled={resetting}
        className="mt-3 text-xs font-medium text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline disabled:opacity-50"
      >
        {resetting ? "Resetting…" : "Reset demo data"}
      </button>
    </motion.div>
  );
}
