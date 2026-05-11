import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {}
}

async function globalTeardown() {
  loadEnvLocal();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) return;

  const dbName = new URL(mongoUri).pathname.slice(1) || "wisdmtimelogger";
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  await db.collection("users").deleteOne({ email: "e2etest@wisdmlabs.com" });
  await client.close();
  console.log("✓ Global teardown complete — test user removed");
}

export default globalTeardown;
