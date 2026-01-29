import mongoose from "mongoose";
import { Schema } from "mongoose";

const ReviewSchema = new Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    softSkills: {
      type: Number,
      min: 1,
      max: 5,
    },
    behavioral: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    performanceScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    deadlineAdherence: {
      type: Number,
      min: 1,
      max: 5,
    },
    overallScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comments: {
      type: String,
      trim: true,
    },
    organizationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
  },
  { timestamps: true },
);

export const Review = mongoose.model("Review", ReviewSchema);
