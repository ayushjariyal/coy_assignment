import { getDiscovery } from "@/lib/server";
import { errorJson, handleError, json, swipeSchema } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/swipe  { targetId: string, direction: "like" | "pass" }
 * -> { matched: false } | { matched: true, match: { profile, matchedAt } }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = swipeSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson(
      400,
      "INVALID_BODY",
      'Expected { targetId: string, direction: "like" | "pass" }.',
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  try {
    const { targetId, direction } = parsed.data;
    return json(getDiscovery().recordSwipe(targetId, direction));
  } catch (err) {
    return handleError(err);
  }
}
