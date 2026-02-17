import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "File name is required"],
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  path: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ["notes", "assignment", "resource", "other"],
    default: "other"
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true // Can be downloaded by group members
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ group: 1, createdAt: -1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ category: 1 });

// Virtual for file size in human-readable format
fileSchema.virtual("sizeFormatted").get(function() {
  const bytes = this.size;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
});

// Method to increment download count
fileSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
};

const File = mongoose.model("File", fileSchema);

export default File;
