import { getDiscovery } from "@/lib/server";
import { errorJson, handleError, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/reset: restore the seeded demo state so reviewers can replay the
 * flow. Set DISABLE_RESET=true to turn it off in a real deployment.
 */
export async function POST() {
  if (process.env.DISABLE_RESET === "true") {
    return errorJson(404, "NOT_FOUND", "Not found.");
  }
  try {
    getDiscovery().reset();
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
