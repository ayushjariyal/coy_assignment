import type { Direction, MatchView, PublicProfile, SwipeResult } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "You seem to be offline.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? "Something went wrong.",
    );
  }
  return body as T;
}

export const api = {
  feed: () => request<{ profiles: PublicProfile[] }>("/api/feed").then((r) => r.profiles),
  swipe: (targetId: string, direction: Direction) =>
    request<SwipeResult>("/api/swipe", {
      method: "POST",
      body: JSON.stringify({ targetId, direction }),
    }),
  matches: () => request<{ matches: MatchView[] }>("/api/matches").then((r) => r.matches),
  reset: () => request<{ ok: true }>("/api/reset", { method: "POST" }),
};
