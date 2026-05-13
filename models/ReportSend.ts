import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReportSend extends Document {
  projectId: Types.ObjectId;
  from: string;
  to: string;
  format: string;
  downloadedAt: Date;
  downloadedBy: Types.ObjectId;
  sentAt: Date | null;
  sentBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSendSchema = new Schema<IReportSend>(
  {
    projectId:    { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    from:         { type: String, required: true },
    to:           { type: String, required: true },
    format:       { type: String, required: true, enum: ["xlsx", "csv", "text", "markdown"] },
    downloadedAt: { type: Date, required: true },
    downloadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentAt:       { type: Date, default: null, required: false },
    sentBy:       { type: Schema.Types.ObjectId, ref: "User", default: null, required: false },
  },
  { timestamps: true }
);

// Delete stale cached model so schema changes take effect without server restart
delete (mongoose.models as any).ReportSend;
export default mongoose.model<IReportSend>("ReportSend", ReportSendSchema);
