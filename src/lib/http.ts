import { NextResponse } from "next/server";
import { z } from "zod";
import { DiscoveryError, type DiscoveryErrorCode } from "./discovery";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function errorJson(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: NO_STORE },
  );
}

const STATUS_BY_CODE: Record<DiscoveryErrorCode, number> = {
  INVALID_TARGET: 400,
  NOT_FOUND: 404,
  ALREADY_SWIPED: 409,
};

/** Map thrown errors to HTTP responses without leaking internals. */
export function handleError(err: unknown) {
  if (err instanceof DiscoveryError) {
    return errorJson(STATUS_BY_CODE[err.code], err.code, err.message);
  }
  console.error("[api] unexpected error", err);
  return errorJson(500, "INTERNAL", "Something went wrong.");
}

export const swipeSchema = z
  .object({
    targetId: z.string().trim().min(1).max(64),
    direction: z.enum(["like", "pass"]),
  })
  .strict();
