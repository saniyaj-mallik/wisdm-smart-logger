import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "dev" | "sme" | "manager" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  mcpApiKeyHash: string | null;
  mcpApiKeyHint: string | null;
  googleAccessToken:  string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry:  number | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["dev", "sme", "manager", "admin"],
      default: "dev",
    },
    isActive: { type: Boolean, default: true },
    mcpApiKeyHash:       { type: String, default: null },
    mcpApiKeyHint:       { type: String, default: null },
    googleAccessToken:   { type: String, default: null },
    googleRefreshToken:  { type: String, default: null },
    googleTokenExpiry:   { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
