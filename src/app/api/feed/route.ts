import { getDiscovery } from "@/lib/server";
import { handleError, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/feed: profiles the user has not swiped on yet. */
export async function GET() {
  try {
    return json({ profiles: getDiscovery().getFeed() });
  } catch (err) {
    return handleError(err);
  }
}
