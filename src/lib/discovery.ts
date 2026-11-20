import type { Store } from "./store";
import type {
  DbData,
  Direction,
  Match,
  MatchView,
  Profile,
  PublicProfile,
  SwipeResult,
} from "./types";

export const CURRENT_USER_ID = "me";

export type DiscoveryErrorCode = "NOT_FOUND" | "ALREADY_SWIPED" | "INVALID_TARGET";

export class DiscoveryError extends Error {
  constructor(
    public readonly code: DiscoveryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DiscoveryError";
  }
}

/**
 * Allowlist projection. Never spread a stored profile into a response;
 * always go through this function.
 */
export function toPublicProfile(p: Profile): PublicProfile {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    photo: p.photo,
    bio: p.bio,
    city: p.city,
    ...(p.college ? { college: p.college } : {}),
    interests: [...p.interests],
  };
}

/** Canonical ordering of a match pair so each match is stored once. */
export function matchKey(a: string, b: string): Pick<Match, "userA" | "userB"> {
  return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
}

/** Fisher–Yates shuffle with an injectable RNG (deterministic in tests). */
export function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface DiscoveryOptions {
  store: Store;
  seed: () => DbData;
  userId?: string;
  now?: () => Date;
  random?: () => number;
}

export function createDiscoveryService({
  store,
  seed,
  userId = CURRENT_USER_ID,
  now = () => new Date(),
  random = Math.random,
}: DiscoveryOptions) {
  const likedBy = (data: DbData, swiperId: string, targetId: string) =>
    data.swipes.some(
      (s) => s.swiperId === swiperId && s.targetId === targetId && s.direction === "like",
    );

  return {
    /**
     * Profiles the current user has not swiped on yet.
     *
     * Privacy: the order is a fresh random shuffle on every call and depends
     * only on the RNG, never on whether a profile has liked the user, so the
     * position of a card can't be used to infer anything. The payload carries
     * no like-related fields.
     */
    getFeed(): PublicProfile[] {
      const data = store.load();
      const swiped = new Set(
        data.swipes.filter((s) => s.swiperId === userId).map((s) => s.targetId),
      );
      const candidates = data.profiles.filter((p) => p.id !== userId && !swiped.has(p.id));
      return shuffle(candidates, random).map(toPublicProfile);
    },

    /**
     * Record a like/pass. Returns `{ matched: true }` only when this swipe
     * completes a mutual like. A pass or one-sided like always returns the
     * identical `{ matched: false }`.
     *
     * The whole load -> check -> save sequence is synchronous, so it is atomic
     * inside a single Node process.
     */
    recordSwipe(targetId: string, direction: Direction): SwipeResult {
      if (targetId === userId) {
        throw new DiscoveryError("INVALID_TARGET", "You can't swipe on yourself.");
      }

      const data = store.load();
      const target = data.profiles.find((p) => p.id === targetId);
      if (!target) {
        throw new DiscoveryError("NOT_FOUND", "Profile not found.");
      }
      if (data.swipes.some((s) => s.swiperId === userId && s.targetId === targetId)) {
        throw new DiscoveryError("ALREADY_SWIPED", "You've already swiped on this profile.");
      }

      const timestamp = now().toISOString();
      data.swipes.push({ swiperId: userId, targetId, direction, createdAt: timestamp });

      let result: SwipeResult = { matched: false };

      if (direction === "like" && likedBy(data, targetId, userId)) {
        const key = matchKey(userId, targetId);
        const existing = data.matches.find((m) => m.userA === key.userA && m.userB === key.userB);
        const match = existing ?? { ...key, createdAt: timestamp };
        if (!existing) data.matches.push(match);
        result = {
          matched: true,
          match: { profile: toPublicProfile(target), matchedAt: match.createdAt },
        };
      }

      store.save(data);
      return result;
    },

    /** Mutual matches only, newest first. One-sided likes never appear here. */
    getMatches(): MatchView[] {
      const data = store.load();
      const byId = new Map(data.profiles.map((p) => [p.id, p]));

      return data.matches
        .filter((m) => m.userA === userId || m.userB === userId)
        // Defence in depth: only surface a match if both like-swipes really exist.
        .filter((m) => likedBy(data, m.userA, m.userB) && likedBy(data, m.userB, m.userA))
        .map((m) => {
          const otherId = m.userA === userId ? m.userB : m.userA;
          const other = byId.get(otherId);
          return other ? { profile: toPublicProfile(other), matchedAt: m.createdAt } : null;
        })
        .filter((m): m is MatchView => m !== null)
        .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt));
    },

    /** Restore the seeded demo state. */
    reset(): void {
      store.save(seed());
    },
  };
}

export type DiscoveryService = ReturnType<typeof createDiscoveryService>;
