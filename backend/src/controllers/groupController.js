import Group from "../models/Group.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

/**
 * Create a new study group
 * POST /api/groups
 */
export const createGroup = async (req, res) => {
  try {
    const { name, description, subject, courseCode, tags, isPublic, allowMemberInvites, maxMembers } = req.body;
    const userId = req.user._id;

    // Create group
    const group = new Group({
      name,
      description,
      creator: userId,
      admins: [userId],
      subject,
      courseCode,
      tags: tags || [],
      settings: {
        isPublic: isPublic !== undefined ? isPublic : true,
        allowMemberInvites: allowMemberInvites !== undefined ? allowMemberInvites : true,
        maxMembers: maxMembers || 50
      }
    });

    // Add creator as first member
    group.addMember(userId, "admin");
    await group.save();

    // Populate creator and members
    await group.populate("creator", "name email profilePicture");
    await group.populate("members.user", "name email profilePicture");

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: { group }
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating group",
      error: error.message
    });
  }
};

/**
 * Get all groups (public or user's groups)
 * GET /api/groups
 */
export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, subject, courseCode, myGroups } = req.query;

    let query = { isActive: true };

    if (myGroups === "true") {
      // Get groups where user is a member
      query["members.user"] = userId;
    } else {
      // Get public groups
      query.isPublic = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ];
    }

    if (subject) {
      query.subject = subject;
    }

    if (courseCode) {
      query.courseCode = courseCode;
    }

    const groups = await Group.find(query)
      .populate("creator", "name email profilePicture")
      .populate("members.user", "name email profilePicture")
      .populate("admins", "name email profilePicture")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: { groups }
    });
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching groups",
      error: error.message
    });
  }
};

/**
 * Get single group by ID
 * GET /api/groups/:id
 */
export const getGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id)
      .populate("creator", "name email profilePicture")
      .populate("members.user", "name email profilePicture department year")
      .populate("admins", "name email profilePicture");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Check if user is member (for private groups)
    if (!group.settings.isPublic && !group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member of this group."
      });
    }

    res.status(200).json({
      success: true,
      data: { group }
    });
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching group",
      error: error.message
    });
  }
};

/**
 * Join a group
 * POST /api/groups/:id/join
 */
export const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!group.isActive) {
      return res.status(400).json({
        success: false,
        message: "Group is not active"
      });
    }

    if (group.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group"
      });
    }

    // Check if group is full
    if (group.members.length >= group.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "Group has reached maximum member limit"
      });
    }

    // Add user as member
    group.addMember(userId);
    await group.save();

    // Create system message
    const user = await User.findById(userId);
    const systemMessage = new Message({
      group: group._id,
      sender: userId,
      content: `${user.name} joined the group`,
      type: "system"
    });
    await systemMessage.save();

    await group.populate("members.user", "name email profilePicture");

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${group._id}`).emit("member-joined", {
        groupId: group._id,
        user: user.toJSON(),
        message: systemMessage
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully joined group",
      data: { group }
    });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({
      success: false,
      message: "Error joining group",
      error: error.message
    });
  }
};

/**
 * Leave a group
 * POST /api/groups/:id/leave
 */
export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!group.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group"
      });
    }

    // Creator cannot leave (must delete group or transfer ownership)
    if (group.creator.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Group creator cannot leave. Delete the group or transfer ownership first."
      });
    }

    // Remove user from group
    group.removeMember(userId);
    await group.save();

    // Create system message
    const user = await User.findById(userId);
    const systemMessage = new Message({
      group: group._id,
      sender: userId,
      content: `${user.name} left the group`,
      type: "system"
    });
    await systemMessage.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${group._id}`).emit("member-left", {
        groupId: group._id,
        userId: userId.toString(),
        message: systemMessage
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully left group"
    });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({
      success: false,
      message: "Error leaving group",
      error: error.message
    });
  }
};

/**
 * Update group
 * PUT /api/groups/:id
 */
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { name, description, subject, courseCode, tags, settings } = req.body;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Check if user is admin
    if (!group.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update group settings"
      });
    }

    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (subject !== undefined) group.subject = subject;
    if (courseCode !== undefined) group.courseCode = courseCode;
    if (tags) group.tags = tags;
    if (settings) {
      group.settings = { ...group.settings, ...settings };
    }

    await group.save();
    await group.populate("members.user", "name email profilePicture");

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: { group }
    });
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating group",
      error: error.message
    });
  }
};

/**
 * Delete group
 * DELETE /api/groups/:id
 */
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Only creator can delete group
    if (group.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only group creator can delete the group"
      });
    }

    // Soft delete - mark as inactive
    group.isActive = false;
    await group.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${group._id}`).emit("group-deleted", {
        groupId: group._id
      });
    }

    res.status(200).json({
      success: true,
      message: "Group deleted successfully"
    });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting group",
      error: error.message
    });
  }
};

/**
 * Add member to group (invite)
 * POST /api/groups/:id/members
 */
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: newMemberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Check permissions
    if (!group.isAdmin(userId) && !group.settings.allowMemberInvites) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add members"
      });
    }

    // Check if user exists
    const newMember = await User.findById(newMemberId);
    if (!newMember) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (group.isMember(newMemberId)) {
      return res.status(400).json({
        success: false,
        message: "User is already a member"
      });
    }

    if (group.members.length >= group.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "Group has reached maximum member limit"
      });
    }

    group.addMember(newMemberId);
    await group.save();

    await group.populate("members.user", "name email profilePicture");

    // Create system message
    const inviter = await User.findById(userId);
    const systemMessage = new Message({
      group: group._id,
      sender: userId,
      content: `${inviter.name} added ${newMember.name} to the group`,
      type: "system"
    });
    await systemMessage.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${group._id}`).emit("member-added", {
        groupId: group._id,
        user: newMember.toJSON(),
        message: systemMessage
      });
    }

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      data: { group }
    });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding member",
      error: error.message
    });
  }
};

/**
 * Remove member from group
 * DELETE /api/groups/:id/members/:memberId
 */
export const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Only admins can remove members
    if (!group.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can remove members"
      });
    }

    // Cannot remove creator
    if (group.creator.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove group creator"
      });
    }

    if (!group.isMember(memberId)) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this group"
      });
    }

    const removedUser = await User.findById(memberId);
    group.removeMember(memberId);
    await group.save();

    // Create system message
    const remover = await User.findById(userId);
    const systemMessage = new Message({
      group: group._id,
      sender: userId,
      content: `${remover.name} removed ${removedUser.name} from the group`,
      type: "system"
    });
    await systemMessage.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${group._id}`).emit("member-removed", {
        groupId: group._id,
        userId: memberId,
        message: systemMessage
      });
    }

    res.status(200).json({
      success: true,
      message: "Member removed successfully"
    });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing member",
      error: error.message
    });
  }
};
