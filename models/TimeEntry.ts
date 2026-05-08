import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITimeEntry extends Document {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  taskId: Types.ObjectId;
  hours: number | null;
  startTime: string | null;
  endTime: string | null;
  loggedAt: Date;
  isBillable: boolean;
  aiUsed: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User",    required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    taskId:    { type: Schema.Types.ObjectId, ref: "Task",    required: true },
    hours:     { type: Number, default: null, min: 0.01, max: 24 },
    startTime: { type: String, default: null },
    endTime:   { type: String, default: null },
    loggedAt:  { type: Date, required: true, index: true },
    isBillable:{ type: Boolean, default: true },
    aiUsed:    { type: Boolean, default: false },
    notes:     { type: String, default: null, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.models.TimeEntry ||
  mongoose.model<ITimeEntry>("TimeEntry", TimeEntrySchema);
