import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const TEST_EMAIL = "e2e-test@smart-logger.test";
export const TEST_PASSWORD = "TestPass@123";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, default: "dev" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

async function globalSetup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  await mongoose.connect(uri);

  const User =
    mongoose.models.User ?? mongoose.model("User", UserSchema);

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  await User.findOneAndUpdate(
    { email: TEST_EMAIL },
    {
      $set: {
        name: "E2E Test User",
        passwordHash,
        isActive: true,
        role: "dev",
      },
    },
    { upsert: true }
  );

  await mongoose.disconnect();
  console.log(`\n[E2E setup] Test user ready: ${TEST_EMAIL}`);
}

export default globalSetup;
