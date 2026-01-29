import mongoose from "mongoose";
import { Schema } from "mongoose";

const NotificationViewSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userType: {
      type: String,
      enum: ["HR", "Employee"],
      required: true,
    },
    organizationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    lastViewedNotices: {
      type: Date,
      default: null,
    },
    lastViewedLeaves: {
      type: Date,
      default: null,
    },
    lastViewedRequests: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Create compound index for efficient lookups
NotificationViewSchema.index({ userId: 1, userType: 1, organizationID: 1 }, { unique: true });

export const NotificationView = mongoose.model("NotificationView", NotificationViewSchema);
