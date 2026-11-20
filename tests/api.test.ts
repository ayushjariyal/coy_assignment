import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LIKED_CURRENT_USER, SEED_PROFILES } from "@/data/seed";
import { resetDiscoverySingleton } from "@/lib/server";
import { GET as getFeed } from "@/app/api/feed/route";
import { POST as postSwipe } from "@/app/api/swipe/route";
import { GET as getMatches } from "@/app/api/matches/route";
import { POST as postReset } from "@/app/api/reset/route";

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coy-api-"));
  process.env.COY_DB_PATH = path.join(tmpDir, "db.json");
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.COY_DB_PATH;
});

beforeEach(() => {
  fs.rmSync(process.env.COY_DB_PATH!, { force: true });
  resetDiscoverySingleton();
});

const swipe = (body: unknown) =>
  postSwipe(
    new Request("http://test/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const NON_LIKER = SEED_PROFILES.find((p) => !LIKED_CURRENT_USER.includes(p.id))!.id;
const LIKER = LIKED_CURRENT_USER[0];

describe("GET /api/feed", () => {
  it("returns all seeded profiles initially, with no caching", async () => {
    const res = await getFeed();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const { profiles } = await res.json();
    expect(profiles).toHaveLength(SEED_PROFILES.length);
  });

  it("never contains like/match information anywhere in the payload", async () => {
    const text = await (await getFeed()).text();
    expect(text).not.toMatch(/liked|likes|swipe|match|admirer/i);
  });
});

describe("POST /api/swipe", () => {
  it("records a pass and removes the profile from the feed", async () => {
    const res = await swipe({ targetId: NON_LIKER, direction: "pass" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ matched: false });

    const { profiles } = await (await getFeed()).json();
    expect(profiles.map((p: { id: string }) => p.id)).not.toContain(NON_LIKER);
  });

  it("returns matched:true with the profile for a mutual like", async () => {
    const res = await swipe({ targetId: LIKER, direction: "like" });
    const body = await res.json();
    expect(body.matched).toBe(true);
    expect(body.match.profile.id).toBe(LIKER);
  });

  it("returns 409 when swiping the same profile twice", async () => {
    await swipe({ targetId: NON_LIKER, direction: "pass" });
    const res = await swipe({ targetId: NON_LIKER, direction: "like" });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("ALREADY_SWIPED");
  });

  it("returns 404 for an unknown profile", async () => {
    const res = await swipe({ targetId: "does-not-exist", direction: "like" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when swiping on yourself", async () => {
    const res = await swipe({ targetId: "me", direction: "like" });
    expect(res.status).toBe(400);
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["missing targetId", { direction: "like" }],
    ["bad direction", { targetId: NON_LIKER, direction: "superlike" }],
    ["empty targetId", { targetId: "  ", direction: "like" }],
    ["unexpected fields", { targetId: NON_LIKER, direction: "like", matched: true }],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await swipe(body);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/matches", () => {
  it("lists only mutual matches", async () => {
    await swipe({ targetId: LIKER, direction: "like" });
    await swipe({ targetId: NON_LIKER, direction: "like" });
    const { matches } = await (await getMatches()).json();
    expect(matches.map((m: { profile: { id: string } }) => m.profile.id)).toEqual([LIKER]);
  });
});

describe("persistence", () => {
  it("keeps swipes and matches across a 'restart' (new service instance)", async () => {
    await swipe({ targetId: LIKER, direction: "like" });
    await swipe({ targetId: NON_LIKER, direction: "pass" });

    resetDiscoverySingleton(); // simulate a server restart / page reload

    const { profiles } = await (await getFeed()).json();
    const ids = profiles.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(LIKER);
    expect(ids).not.toContain(NON_LIKER);

    const { matches } = await (await getMatches()).json();
    expect(matches).toHaveLength(1);
  });
});

describe("POST /api/reset", () => {
  it("restores the seed", async () => {
    await swipe({ targetId: LIKER, direction: "like" });
    expect((await postReset()).status).toBe(200);
    const { profiles } = await (await getFeed()).json();
    expect(profiles).toHaveLength(SEED_PROFILES.length);
  });

  it("can be disabled via env", async () => {
    process.env.DISABLE_RESET = "true";
    try {
      expect((await postReset()).status).toBe(404);
    } finally {
      delete process.env.DISABLE_RESET;
    }
  });
});
