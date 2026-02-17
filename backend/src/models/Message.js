import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: [true, "Message content is required"],
    trim: true,
    maxlength: [5000, "Message cannot exceed 5000 characters"]
  },
  type: {
    type: String,
    enum: ["text", "file", "system"],
    default: "text"
  },
  file: {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File"
    },
    fileName: String,
    fileSize: Number,
    fileType: String
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ "readBy.user": 1 });

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from same user
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji,
    createdAt: new Date()
  });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
