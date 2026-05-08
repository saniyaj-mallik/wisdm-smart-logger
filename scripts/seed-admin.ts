import { connectDB } from "../lib/mongodb";
import User from "../models/User";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  await connectDB();

  const email = "admin@wisdmlabs.com";
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin user already exists:", email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("admin123!", 12);
  await User.create({
    name: "Admin User",
    email,
    passwordHash,
    role: "admin",
    isActive: true,
  });
  console.log("Admin user created:", email, "/ password: admin123!");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
