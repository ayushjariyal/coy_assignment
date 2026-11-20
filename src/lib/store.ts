import fs from "node:fs";
import path from "node:path";
import type { DbData } from "./types";

/**
 * Minimal persistence boundary. The discovery service only depends on this
 * interface, so swapping the JSON file for SQLite/Postgres later means writing
 * one new class, not touching business logic.
 */
export interface Store {
  load(): DbData;
  save(data: DbData): void;
}

/** In-memory store used by unit tests. Clones on every read/write so callers can't mutate shared state. */
export class MemoryStore implements Store {
  private data: DbData;

  constructor(initial: DbData) {
    this.data = structuredClone(initial);
  }

  load(): DbData {
    return structuredClone(this.data);
  }

  save(data: DbData): void {
    this.data = structuredClone(data);
  }
}

/**
 * JSON-file store.
 *
 * - Uses synchronous fs calls on purpose: Node runs JS on a single thread, so a
 *   load -> mutate -> save sequence with no `await` in between is atomic within
 *   the process (no lost updates between concurrent requests).
 * - Writes to a temp file and renames it over the real one, so a crash
 *   mid-write never leaves a half-written database.
 * - Seeds the file on first access.
 */
export class JsonFileStore implements Store {
  constructor(
    private readonly filePath: string,
    private readonly seed: () => DbData,
  ) {}

  load(): DbData {
    if (!fs.existsSync(this.filePath)) {
      const initial = this.seed();
      this.save(initial);
      return initial;
    }

    const raw = fs.readFileSync(this.filePath, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        `Database file at ${this.filePath} is not valid JSON. Delete it (or run "npm run seed") to start fresh.`,
      );
    }

    if (!isDbData(parsed)) {
      throw new Error(
        `Database file at ${this.filePath} has an unexpected shape. Delete it (or run "npm run seed") to start fresh.`,
      );
    }
    return parsed;
  }

  save(data: DbData): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    try {
      fs.renameSync(tmp, this.filePath);
    } catch {
      // On Windows, rename can fail with EPERM if another process (e.g. an
      // antivirus scanner) briefly holds the file. Fall back to a direct write.
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
      fs.rmSync(tmp, { force: true });
    }
  }
}

function isDbData(value: unknown): value is DbData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.profiles) &&
    Array.isArray(v.swipes) &&
    Array.isArray(v.matches)
  );
}
