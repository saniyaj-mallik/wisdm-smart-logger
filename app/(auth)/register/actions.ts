"use server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { RegisterSchema } from "@/lib/zod-schemas";

export async function registerUser(formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success)
    return { error: parsed.error.flatten().fieldErrors };

  await connectDB();
  const existing = await User.findOne({ email: parsed.data.email });
  if (existing) return { error: { email: ["Email already registered"] } };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  });
  return { success: true };
}
