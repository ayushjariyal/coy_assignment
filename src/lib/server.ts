import path from "node:path";
import { buildSeed } from "@/data/seed";
import { createDiscoveryService, type DiscoveryService } from "./discovery";
import { JsonFileStore } from "./store";

let service: DiscoveryService | null = null;

export function dbPath(): string {
  return process.env.COY_DB_PATH ?? path.join(process.cwd(), "data", "db.json");
}

/** Lazily-created singleton used by the API routes. */
export function getDiscovery(): DiscoveryService {
  if (!service) {
    service = createDiscoveryService({
      store: new JsonFileStore(dbPath(), () => buildSeed()),
      seed: () => buildSeed(),
    });
  }
  return service;
}

/** Test hook: forget the singleton so the next call re-reads env vars. */
export function resetDiscoverySingleton(): void {
  service = null;
}
