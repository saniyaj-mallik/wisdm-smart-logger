import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITask extends Document {
  projectId: Types.ObjectId;
  name: string;
  description: string | null;
  estimatedHours: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    estimatedHours: { type: Number, default: null, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TaskSchema.index({ projectId: 1, name: 1 }, { unique: true });

export default mongoose.models.Task ||
  mongoose.model<ITask>("Task", TaskSchema);
