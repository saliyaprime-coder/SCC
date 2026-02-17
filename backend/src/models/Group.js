import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Group name is required"],
    trim: true,
    maxlength: [100, "Group name cannot exceed 100 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member"
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: true // Public groups can be discovered, private groups require invite
    },
    allowMemberInvites: {
      type: Boolean,
      default: true // Members can invite others
    },
    maxMembers: {
      type: Number,
      default: 50,
      min: 2,
      max: 200
    }
  },
  subject: {
    type: String,
    trim: true
  },
  courseCode: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  avatar: {
    type: String,
    default: ""
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
groupSchema.index({ creator: 1 });
groupSchema.index({ "members.user": 1 });
groupSchema.index({ isPublic: 1, isActive: 1 });
groupSchema.index({ subject: 1, courseCode: 1 });

// Virtual for member count
groupSchema.virtual("memberCount").get(function() {
  return this.members.length;
});

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  return this.creator.toString() === userId.toString() || 
         this.admins.some(admin => admin.toString() === userId.toString()) ||
         this.members.some(member => 
           member.user.toString() === userId.toString() && member.role === "admin"
         );
};

// Method to add member
groupSchema.methods.addMember = function(userId, role = "member") {
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error("Group has reached maximum member limit");
  }
  
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
};

// Method to remove member
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(
    member => member.user.toString() !== userId.toString()
  );
  // Also remove from admins array if present
  this.admins = this.admins.filter(
    admin => admin.toString() !== userId.toString()
  );
};

// Method to promote member to admin
groupSchema.methods.promoteToAdmin = function(userId) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  if (member) {
    member.role = "admin";
    if (!this.admins.includes(userId)) {
      this.admins.push(userId);
    }
  }
};

const Group = mongoose.model("Group", groupSchema);

export default Group;
