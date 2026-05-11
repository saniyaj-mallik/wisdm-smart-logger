import { chromium } from "@playwright/test";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { mkdirSync } from "fs";
import { resolve } from "path";

export const TEST_EMAIL = "e2etest@wisdmlabs.com";
export const TEST_PASSWORD = "E2eTest@123!";
const TEST_NAME = "E2E Test User";

async function globalSetup() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not set — check .env.local");

  mkdirSync(resolve(process.cwd(), "tests/.auth"), { recursive: true });

  // Extract database name from URI (last segment of the path)
  const dbName = new URL(mongoUri).pathname.slice(1) || "wisdmtimelogger";

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");

  // Delete any existing test user, then insert fresh with known hash
  await users.deleteOne({ email: TEST_EMAIL });
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  await users.insertOne({
    name: TEST_NAME,
    email: TEST_EMAIL,
    passwordHash,
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await client.close();
  console.log(`✓ Test user created in MongoDB (db: ${dbName})`);

  // Verify bcrypt compare works as expected
  const compareCheck = await bcrypt.compare(TEST_PASSWORD, passwordHash);
  if (!compareCheck) throw new Error("bcrypt compare failed — hash mismatch in setup");

  // Log in via browser and persist auth state
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/login");
  await page.locator('input[name="email"]').fill(TEST_EMAIL);
  await page.locator('input[name="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Wait for client-side navigation to /dashboard
  try {
    await page.waitForFunction(
      () => window.location.pathname.startsWith("/dashboard"),
      { timeout: 30000, polling: 500 }
    );
  } catch {
    const errorText = await page.locator(".text-destructive").first().textContent().catch(() => null);
    const currentUrl = page.url();
    throw new Error(
      `Login timed out. URL: ${currentUrl}. Error shown: ${errorText ?? "none"}`
    );
  }

  await context.storageState({ path: "tests/.auth/user.json" });
  await browser.close();
  console.log("✓ Global setup complete — auth state saved");
}

export default globalSetup;
