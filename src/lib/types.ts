// Shared domain types. This file must stay free of Node-only imports because
// the client bundle imports it too.

export type Direction = "like" | "pass";

/** A full profile as stored in the database. */
export interface Profile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  city: string;
  college?: string;
  interests: string[];
}

/**
 * The only shape of a profile that ever leaves the server.
 * It is built from an explicit allowlist (see `toPublicProfile`) so that
 * adding a field to `Profile` can never accidentally leak it to clients.
 */
export type PublicProfile = Pick<
  Profile,
  "id" | "name" | "age" | "photo" | "bio" | "city" | "college" | "interests"
>;

export interface Swipe {
  swiperId: string;
  targetId: string;
  direction: Direction;
  createdAt: string; // ISO timestamp
}

/** A mutual match. `userA < userB` so each pair is stored exactly once. */
export interface Match {
  userA: string;
  userB: string;
  createdAt: string; // ISO timestamp
}

export interface DbData {
  version: 1;
  profiles: Profile[];
  swipes: Swipe[];
  matches: Match[];
}

export interface MatchView {
  profile: PublicProfile;
  matchedAt: string;
}

/**
 * Result of POST /swipe. A pass and a like-without-match return the exact
 * same `{ matched: false }` body, so the response never hints at whether the
 * other person liked you.
 */
export type SwipeResult = { matched: false } | { matched: true; match: MatchView };
