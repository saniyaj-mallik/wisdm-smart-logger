import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  clientName: string | null;
  description: string | null;
  budgetHours: number | null;
  color: string | null;
  isActive: boolean;
  reportFrequencyDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    clientName: { type: String, default: null, trim: true },
    description: { type: String, default: null },
    budgetHours: { type: Number, default: null, min: 0 },
    color: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    reportFrequencyDays: { type: Number, default: 14, min: 1, max: 365 },
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
