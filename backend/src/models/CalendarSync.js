import mongoose from "mongoose";

const calendarSyncSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    googleRefreshToken: {
      type: String,
      select: false
    },
    lastSyncedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const CalendarSync = mongoose.model("CalendarSync", calendarSyncSchema);

export default CalendarSync;

