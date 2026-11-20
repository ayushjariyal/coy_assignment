"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, ApiError } from "@/lib/api-client";
import type { Direction, MatchView, PublicProfile } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { HeartIcon, XIcon } from "./Icons";
import { MatchModal } from "./MatchModal";
import { MatchesList } from "./MatchesList";
import { SwipeCard } from "./SwipeCard";

type View = "swipe" | "matches";
type Toast = { id: number; text: string; tone: "like" | "pass" | "error" };

export function Discover() {
  const [view, setView] = useState<View>("swipe");
  const [deck, setDeck] = useState<PublicProfile[] | null>(null);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchView[] | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [command, setCommand] = useState<Direction | null>(null);
  const [newMatch, setNewMatch] = useState<MatchView | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [resetting, setResetting] = useState(false);
  const toastId = useRef(0);

  const showToast = useCallback((text: string, tone: Toast["tone"]) => {
    setToast({ id: ++toastId.current, text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.tone === "error" ? 2600 : 1100);
    return () => clearTimeout(t);
  }, [toast]);

  const loadFeed = useCallback(async () => {
    setDeckError(null);
    try {
      setDeck(await api.feed());
    } catch (e) {
      setDeckError(e instanceof Error ? e.message : "Couldn't load profiles.");
    }
  }, []);

  const loadMatches = useCallback(async () => {
    setMatchesError(null);
    try {
      setMatches(await api.matches());
    } catch (e) {
      setMatchesError(e instanceof Error ? e.message : "Couldn't load matches.");
    }
  }, []);

  useEffect(() => {
    void loadFeed();
    void loadMatches();
  }, [loadFeed, loadMatches]);

  /**
   * Called once a card has finished flying off screen. The UI updates right away
   * (optimistic), then persists. On failure the card is put back on top.
   */
  const handleSwiped = useCallback(
    async (profile: PublicProfile, direction: Direction) => {
      setDeck((d) => (d ? d.filter((p) => p.id !== profile.id) : d));
      setCommand(null);
      showToast(direction === "like" ? `Liked ${profile.name}` : "Passed", direction);

      try {
        const result = await api.swipe(profile.id, direction);
        if (result.matched) {
          setNewMatch(result.match);
          setMatches((m) => [result.match, ...(m ?? []).filter((x) => x.profile.id !== profile.id)]);
        }
      } catch (e) {
        // 409 = already recorded (e.g. double submit). The server state is what we want, so ignore it.
        if (e instanceof ApiError && e.status === 409) return;
        setDeck((d) => (d ? [profile, ...d.filter((p) => p.id !== profile.id)] : [profile]));
        showToast("Couldn't save that swipe. Please try again.", "error");
      }
    },
    [showToast],
  );

  const top = deck?.[0];
  const canSwipe = view === "swipe" && !!top && !command && !newMatch;

  const requestSwipe = useCallback(
    (direction: Direction) => {
      if (canSwipe) setCommand(direction);
    },
    [canSwipe],
  );

  // Keyboard support for desktop: ← pass, → like.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") requestSwipe("like");
      if (e.key === "ArrowLeft") requestSwipe("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestSwipe]);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.reset();
      setDeck(null);
      setMatches(null);
      await Promise.all([loadFeed(), loadMatches()]);
    } catch {
      showToast("Couldn't reset the demo.", "error");
    } finally {
      setResetting(false);
    }
  };

  const goToMatches = () => {
    setNewMatch(null);
    setView("matches");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between px-4 pb-3 pt-4">
        <h1 className="bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          Discover
        </h1>
        <div role="tablist" aria-label="Discover views" className="flex rounded-full bg-neutral-100 p-1 text-sm font-semibold">
          {(["swipe", "matches"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`relative rounded-full px-3.5 py-1.5 transition-colors ${
                view === v ? "text-neutral-900" : "text-neutral-500"
              }`}
            >
              {view === v && (
                <motion.span
                  layoutId="view-pill"
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {v === "swipe" ? "Swipe" : "Matches"}
                {v === "matches" && matches && matches.length > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 text-[11px] leading-[18px] text-white">
                    {matches.length}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </header>

      {view === "matches" ? (
        <MatchesList
          matches={matches}
          error={matchesError}
          onRetry={loadMatches}
          onStartSwiping={() => setView("swipe")}
        />
      ) : deckError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <p className="text-neutral-600">{deckError}</p>
          <button onClick={loadFeed} className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      ) : deck === null ? (
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4" aria-busy="true" aria-label="Loading profiles">
          <div className="flex-1 animate-pulse rounded-3xl bg-neutral-200" />
          <div className="h-24" />
        </div>
      ) : deck.length === 0 ? (
        <EmptyState onViewMatches={() => setView("matches")} onReset={handleReset} resetting={resetting} />
      ) : (
        <>
          <section aria-label="Profiles" className="relative min-h-0 flex-1 px-4">
            <div className="relative h-full">
              {/* Render top two; the second peeks behind for depth. Reverse so the top card paints last. */}
              {deck
                .slice(0, 2)
                .map((p, i) => (
                  <SwipeCard
                    key={p.id}
                    profile={p}
                    isTop={i === 0}
                    command={i === 0 ? command : null}
                    onSwiped={handleSwiped}
                  />
                ))
                .reverse()}
            </div>

            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast.id}
                  role="status"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold shadow-lg ${
                    toast.tone === "like"
                      ? "bg-emerald-500 text-white"
                      : toast.tone === "pass"
                        ? "bg-neutral-800 text-white"
                        : "bg-rose-600 text-white"
                  }`}
                >
                  {toast.text}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div className="flex items-center justify-center gap-8 py-4">
            <ActionButton
              label={top ? `Pass on ${top.name}` : "Pass"}
              onClick={() => requestSwipe("pass")}
              disabled={!canSwipe}
              className="h-16 w-16 border-2 border-neutral-200 bg-white text-rose-500 hover:border-rose-200"
            >
              <XIcon className="h-8 w-8" strokeWidth={2.6} />
            </ActionButton>
            <ActionButton
              label={top ? `Like ${top.name}` : "Like"}
              onClick={() => requestSwipe("like")}
              disabled={!canSwipe}
              className="h-[72px] w-[72px] bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white shadow-rose-300"
            >
              <HeartIcon className="h-9 w-9" fill="currentColor" stroke="none" />
            </ActionButton>
          </div>
          <p className="-mt-2 hidden pb-2 text-center text-xs text-neutral-400 sm:block">
            Tip: drag the card, or use ← and → keys
          </p>
        </>
      )}

      <MatchModal match={newMatch} onClose={() => setNewMatch(null)} onViewMatches={goToMatches} />

      {/* Error toast outside the swipe view (e.g. reset failure on empty state) */}
      {view !== "swipe" || (deck && deck.length === 0) ? (
        <AnimatePresence>
          {toast?.tone === "error" && (
            <motion.div
              key={toast.id}
              role="alert"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      ) : null}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.88 }}
      whileHover={disabled ? undefined : { scale: 1.06 }}
      className={`flex items-center justify-center rounded-full shadow-lg transition-opacity disabled:opacity-50 ${className}`}
    >
      {children}
    </motion.button>
  );
}
