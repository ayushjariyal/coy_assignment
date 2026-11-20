import { getDiscovery } from "@/lib/server";
import { handleError, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/matches: mutual matches only, newest first. */
export async function GET() {
  try {
    return json({ matches: getDiscovery().getMatches() });
  } catch (err) {
    return handleError(err);
  }
}
