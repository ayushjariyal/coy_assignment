import { describe, expect, it, beforeEach } from "vitest";
import {
  CURRENT_USER_ID,
  DiscoveryError,
  createDiscoveryService,
  shuffle,
  toPublicProfile,
  type DiscoveryService,
} from "@/lib/discovery";
import { MemoryStore } from "@/lib/store";
import type { DbData, Profile } from "@/lib/types";
import { buildSeed, LIKED_CURRENT_USER, SEED_PROFILES } from "@/data/seed";

const PUBLIC_KEYS = ["age", "bio", "city", "college", "id", "interests", "name", "photo"];

const profile = (id: string, extra: Partial<Profile> = {}): Profile => ({
  id,
  name: `Name ${id}`,
  age: 21,
  photo: `https://example.com/${id}.jpg`,
  bio: "bio",
  city: "Bengaluru",
  college: "Some College",
  interests: ["a", "b"],
  ...extra,
});

/** a, b, c, d exist. `a` and `b` already liked me. `c` passed on me. `d` did nothing. */
function fixture(): DbData {
  return {
    version: 1,
    profiles: ["a", "b", "c", "d"].map((id) => profile(id)),
    swipes: [
      { swiperId: "a", targetId: CURRENT_USER_ID, direction: "like", createdAt: "2026-01-01T00:00:00.000Z" },
      { swiperId: "b", targetId: CURRENT_USER_ID, direction: "like", createdAt: "2026-01-01T00:00:00.000Z" },
      { swiperId: "c", targetId: CURRENT_USER_ID, direction: "pass", createdAt: "2026-01-01T00:00:00.000Z" },
    ],
    matches: [],
  };
}

function makeService(data: DbData = fixture()) {
  const store = new MemoryStore(data);
  let t = Date.parse("2026-06-01T00:00:00.000Z");
  const service = createDiscoveryService({
    store,
    seed: fixture,
    now: () => new Date((t += 1000)), // strictly increasing clock
    random: () => 0.42,
  });
  return { store, service };
}

describe("getFeed", () => {
  let service: DiscoveryService;
  beforeEach(() => ({ service } = makeService()));

  it("returns every profile the user hasn't swiped on", () => {
    expect(service.getFeed().map((p) => p.id).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("never includes the current user", () => {
    const data = fixture();
    data.profiles.push(profile(CURRENT_USER_ID));
    const { service } = makeService(data);
    expect(service.getFeed().map((p) => p.id)).not.toContain(CURRENT_USER_ID);
  });

  it("excludes profiles once they've been liked or passed, permanently", () => {
    service.recordSwipe("a", "like");
    service.recordSwipe("c", "pass");
    expect(service.getFeed().map((p) => p.id).sort()).toEqual(["b", "d"]);
    // ...and still excluded on subsequent reads
    expect(service.getFeed().map((p) => p.id).sort()).toEqual(["b", "d"]);
  });

  it("returns an empty list once everyone has been swiped", () => {
    for (const id of ["a", "b", "c", "d"]) service.recordSwipe(id, "pass");
    expect(service.getFeed()).toEqual([]);
  });

  it("exposes only allowlisted public fields: no like/match signals", () => {
    const data = fixture();
    // Simulate someone adding a sensitive field to the stored record later.
    (data.profiles[0] as Profile & { phone?: string; likedYou?: boolean }).phone = "+91 99999 99999";
    (data.profiles[0] as Profile & { likedYou?: boolean }).likedYou = true;
    const { service } = makeService(data);

    for (const p of service.getFeed()) {
      expect(Object.keys(p).sort()).toEqual(PUBLIC_KEYS);
    }
  });

  it("profiles that liked the user look identical to those that didn't", () => {
    const feed = service.getFeed();
    const liker = feed.find((p) => p.id === "a")!;
    const nonLiker = feed.find((p) => p.id === "d")!;
    expect(Object.keys(liker)).toEqual(Object.keys(nonLiker));
  });

  it("orders the feed independently of who liked the user", () => {
    // Same RNG, two worlds that differ ONLY in who liked the user -> same order.
    const likedWorld = fixture();
    const noLikesWorld = { ...fixture(), swipes: [] };
    const order = (d: DbData) =>
      createDiscoveryService({ store: new MemoryStore(d), seed: fixture, random: () => 0.3 })
        .getFeed()
        .map((p) => p.id);
    expect(order(likedWorld)).toEqual(order(noLikesWorld));
  });
});

describe("recordSwipe", () => {
  let service: DiscoveryService;
  beforeEach(() => ({ service } = makeService()));

  it("creates a match when liking someone who already liked the user", () => {
    const result = service.recordSwipe("a", "like");
    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.match.profile.id).toBe("a");
      expect(Object.keys(result.match.profile).sort()).toEqual(PUBLIC_KEYS);
      expect(typeof result.match.matchedAt).toBe("string");
    }
  });

  it("does not match when liking someone who hasn't liked the user", () => {
    expect(service.recordSwipe("d", "like")).toEqual({ matched: false });
  });

  it("does not match when liking someone who passed on the user", () => {
    expect(service.recordSwipe("c", "like")).toEqual({ matched: false });
  });

  it("does not match when passing on someone who liked the user", () => {
    expect(service.recordSwipe("a", "pass")).toEqual({ matched: false });
    expect(service.getMatches()).toEqual([]);
  });

  it("returns byte-identical responses for a pass and a one-sided like", () => {
    const pass = JSON.stringify(service.recordSwipe("a", "pass")); // a liked me
    const like = JSON.stringify(service.recordSwipe("d", "like")); // d did not
    expect(pass).toBe(like);
  });

  it("rejects swiping twice on the same profile and leaves state unchanged", () => {
    const { service, store } = makeService();
    service.recordSwipe("d", "pass");
    const before = store.load();

    expect(() => service.recordSwipe("d", "like")).toThrowError(
      expect.objectContaining({ code: "ALREADY_SWIPED" }),
    );
    expect(store.load()).toEqual(before);
  });

  it("cannot turn a pass into a match by swiping again", () => {
    service.recordSwipe("a", "pass");
    expect(() => service.recordSwipe("a", "like")).toThrow(DiscoveryError);
    expect(service.getMatches()).toEqual([]);
  });

  it("rejects unknown profiles", () => {
    expect(() => service.recordSwipe("nope", "like")).toThrowError(
      expect.objectContaining({ code: "NOT_FOUND" }),
    );
  });

  it("rejects swiping on yourself", () => {
    expect(() => service.recordSwipe(CURRENT_USER_ID, "like")).toThrowError(
      expect.objectContaining({ code: "INVALID_TARGET" }),
    );
  });

  it("persists the swipe and the match to the store", () => {
    const { service, store } = makeService();
    service.recordSwipe("a", "like");
    const data = store.load();
    expect(data.swipes).toContainEqual(
      expect.objectContaining({ swiperId: CURRENT_USER_ID, targetId: "a", direction: "like" }),
    );
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0]).toMatchObject({ userA: "a", userB: CURRENT_USER_ID });
  });

  it("does not duplicate a match row if one already exists", () => {
    const data = fixture();
    data.matches.push({ userA: "a", userB: CURRENT_USER_ID, createdAt: "2026-01-02T00:00:00.000Z" });
    const { service, store } = makeService(data);
    const result = service.recordSwipe("a", "like");
    expect(result.matched).toBe(true);
    expect(store.load().matches).toHaveLength(1);
  });
});

describe("getMatches", () => {
  it("is empty initially even though people have liked the user", () => {
    const { service } = makeService();
    expect(service.getMatches()).toEqual([]);
  });

  it("lists only mutual matches, newest first", () => {
    const { service } = makeService();
    service.recordSwipe("a", "like"); // match
    service.recordSwipe("d", "like"); // one-sided
    service.recordSwipe("b", "like"); // match (later)
    service.recordSwipe("c", "like"); // they passed on me

    const matches = service.getMatches();
    expect(matches.map((m) => m.profile.id)).toEqual(["b", "a"]);
    for (const m of matches) expect(Object.keys(m.profile).sort()).toEqual(PUBLIC_KEYS);
  });

  it("ignores a match row that isn't backed by two likes (defence in depth)", () => {
    const data = fixture();
    data.matches.push({ userA: "d", userB: CURRENT_USER_ID, createdAt: "2026-01-02T00:00:00.000Z" });
    const { service } = makeService(data);
    expect(service.getMatches()).toEqual([]);
  });

  it("ignores matches between other users", () => {
    const data = fixture();
    data.swipes.push(
      { swiperId: "c", targetId: "d", direction: "like", createdAt: "2026-01-01T00:00:00.000Z" },
      { swiperId: "d", targetId: "c", direction: "like", createdAt: "2026-01-01T00:00:00.000Z" },
    );
    data.matches.push({ userA: "c", userB: "d", createdAt: "2026-01-02T00:00:00.000Z" });
    const { service } = makeService(data);
    expect(service.getMatches()).toEqual([]);
  });
});

describe("reset", () => {
  it("restores the seed state", () => {
    const { service } = makeService();
    service.recordSwipe("a", "like");
    service.reset();
    expect(service.getFeed()).toHaveLength(4);
    expect(service.getMatches()).toEqual([]);
  });
});

describe("helpers", () => {
  it("shuffle is a permutation and does not mutate its input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, Math.random);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual(input);
  });

  it("toPublicProfile omits college when absent", () => {
    const p = toPublicProfile(profile("x", { college: undefined }));
    expect("college" in p).toBe(false);
  });
});

describe("seed data", () => {
  const seed = buildSeed();

  it("has at least 30 complete profiles with unique ids", () => {
    expect(seed.profiles.length).toBeGreaterThanOrEqual(30);
    expect(new Set(seed.profiles.map((p) => p.id)).size).toBe(seed.profiles.length);
    for (const p of seed.profiles) {
      expect(p.name && p.photo && p.bio && p.city).toBeTruthy();
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(p.interests.length).toBeGreaterThan(0);
    }
  });

  it("includes some profiles that already liked the user, all of which exist", () => {
    const ids = new Set(SEED_PROFILES.map((p) => p.id));
    expect(LIKED_CURRENT_USER.length).toBeGreaterThan(0);
    for (const id of LIKED_CURRENT_USER) expect(ids.has(id)).toBe(true);
  });

  it("produces a demo match when liking a seeded admirer", () => {
    const { service } = makeService(buildSeed());
    expect(service.recordSwipe(LIKED_CURRENT_USER[0], "like").matched).toBe(true);
  });
});
