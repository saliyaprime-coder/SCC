import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    subjectCode: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ["lecture", "lab", "tutorial", "exam", "study", "other"],
      default: "lecture"
    },
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    universitySchedule: {
      type: [eventSchema],
      default: []
    },
    optimizedSchedule: {
      type: [eventSchema],
      default: []
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

// Always keep one latest timetable per user for simplicity
timetableSchema.index({ user: 1, createdAt: -1 });

const Timetable = mongoose.model("Timetable", timetableSchema);

export default Timetable;

