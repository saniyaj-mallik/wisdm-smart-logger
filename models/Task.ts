import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITask extends Document {
  projectId: Types.ObjectId;
  name: string;
  description: string | null;
  estimatedHours: number | null;
  assignees: Types.ObjectId[];
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
    assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TaskSchema.index({ projectId: 1, name: 1 }, { unique: true });

// Delete cached model so schema changes are always picked up after HMR or restarts
if (mongoose.models.Task) mongoose.deleteModel("Task");
export default mongoose.model<ITask>("Task", TaskSchema);
