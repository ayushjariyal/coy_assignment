// Usage: npm run seed  -> (re)writes data/db.json with the demo seed.
import { buildSeed, LIKED_CURRENT_USER } from "../src/data/seed";
import { JsonFileStore } from "../src/lib/store";
import { dbPath } from "../src/lib/server";

const data = buildSeed();
new JsonFileStore(dbPath(), buildSeed).save(data);
console.log(
  `Seeded ${data.profiles.length} profiles (${LIKED_CURRENT_USER.length} have already liked you) -> ${dbPath()}`,
);
