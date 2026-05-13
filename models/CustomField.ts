import mongoose, { Schema, Document } from "mongoose";

export interface ICustomField extends Document {
  label: string;
  type: "yes_no" | "number" | "text";
  unit: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomFieldSchema = new Schema<ICustomField>(
  {
    label:    { type: String, required: true, trim: true, maxlength: 100 },
    type:     { type: String, enum: ["yes_no", "number", "text"], required: true },
    unit:     { type: String, default: null, maxlength: 50 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.CustomField ||
  mongoose.model<ICustomField>("CustomField", CustomFieldSchema);
