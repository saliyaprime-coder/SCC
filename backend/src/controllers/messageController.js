import Message from "../models/Message.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

/**
 * Send a message to a group
 * POST /api/groups/:groupId/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, replyTo, type = "text" } = req.body;
    const userId = req.user._id;

    // Verify group exists and user is member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: "You must be a member to send messages"
      });
    }

    // Create message
    const message = new Message({
      group: groupId,
      sender: userId,
      content,
      type,
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate("sender", "name email profilePicture");
    if (message.replyTo) {
      await message.populate("replyTo", "content sender");
    }

    // Mark as read by sender
    message.markAsRead(userId);
    await message.save();

    // Emit socket event to group
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${groupId}`).emit("new-message", {
        message: message.toObject()
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { message }
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message
    });
  }
};

/**
 * Get messages from a group
 * GET /api/groups/:groupId/messages
 */
export const getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50, before } = req.query;

    // Verify group exists and user is member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: "You must be a member to view messages"
      });
    }

    // Build query
    let query = { group: groupId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages
    const messages = await Message.find(query)
      .populate("sender", "name email profilePicture")
      .populate("replyTo", "content sender")
      .populate("file.fileId", "name originalName mimeType size")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Reverse to show oldest first
    messages.reverse();

    // Mark messages as read
    const unreadMessages = messages.filter(
      msg => !msg.readBy.some(read => read.user.toString() === userId.toString())
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(m => m._id) } },
        { $push: { readBy: { user: userId, readAt: new Date() } } }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message
    });
  }
};

/**
 * Edit a message
 * PUT /api/messages/:messageId
 */
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate("group");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Only sender can edit
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages"
      });
    }

    // Cannot edit system messages
    if (message.type === "system") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit system messages"
      });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate("sender", "name email profilePicture");

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${message.group._id}`).emit("message-edited", {
        messageId: message._id,
        message: message.toObject()
      });
    }

    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: { message }
    });
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({
      success: false,
      message: "Error editing message",
      error: error.message
    });
  }
};

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate("group");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    const group = message.group;

    // Only sender or admin can delete
    const isSender = message.sender.toString() === userId.toString();
    const isAdmin = group.isAdmin(userId);

    if (!isSender && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this message"
      });
    }

    // Soft delete
    message.isDeleted = true;
    message.content = "[Message deleted]";
    await message.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${group._id}`).emit("message-deleted", {
        messageId: message._id,
        groupId: group._id
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: error.message
    });
  }
};

/**
 * Add reaction to message
 * POST /api/messages/:messageId/reactions
 */
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate("group");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Verify user is group member
    if (!message.group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to react"
      });
    }

    message.addReaction(userId, emoji);
    await message.save();

    await message.populate("sender", "name email profilePicture");

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${message.group._id}`).emit("reaction-added", {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.status(200).json({
      success: true,
      message: "Reaction added successfully",
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error("Add reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding reaction",
      error: error.message
    });
  }
};

/**
 * Remove reaction from message
 * DELETE /api/messages/:messageId/reactions
 */
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate("group");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    message.removeReaction(userId);
    await message.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${message.group._id}`).emit("reaction-removed", {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.status(200).json({
      success: true,
      message: "Reaction removed successfully",
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error("Remove reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing reaction",
      error: error.message
    });
  }
};
