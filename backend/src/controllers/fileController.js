import File from "../models/File.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload a file to a group
 * POST /api/groups/:groupId/files
 */
export const uploadFile = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { description, category = "other", tags } = req.body;

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
        message: "You must be a member to upload files"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Create file record
    const file = new File({
      name: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: userId,
      group: groupId,
      category,
      description: description || "",
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",")) : []
    });

    await file.save();
    await file.populate("uploadedBy", "name email profilePicture");

    // Create system message about file upload
    const user = req.user;
    const systemMessage = new Message({
      group: groupId,
      sender: userId,
      content: `${user.name} uploaded a file: ${file.originalName}`,
      type: "file",
      file: {
        fileId: file._id,
        fileName: file.originalName,
        fileSize: file.size,
        fileType: file.mimeType
      }
    });
    await systemMessage.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${groupId}`).emit("file-uploaded", {
        file: file.toObject(),
        message: systemMessage.toObject()
      });
    }

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: { file }
    });
  } catch (error) {
    console.error("Upload file error:", error);
    
    // Clean up uploaded file if database save failed
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error.message
    });
  }
};

/**
 * Get files from a group
 * GET /api/groups/:groupId/files
 */
export const getFiles = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { category, search } = req.query;

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
        message: "You must be a member to view files"
      });
    }

    // Build query
    let query = { group: groupId };
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const files = await File.find(query)
      .populate("uploadedBy", "name email profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { files }
    });
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching files",
      error: error.message
    });
  }
};

/**
 * Download a file
 * GET /api/files/:fileId/download
 */
export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user._id;

    const file = await File.findById(fileId)
      .populate("group");

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    // Verify user is group member
    if (!file.group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to download files"
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server"
      });
    }

    // Increment download count
    file.incrementDownload();
    await file.save();

    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
    res.setHeader("Content-Type", file.mimeType);

    // Stream file
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download file error:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading file",
      error: error.message
    });
  }
};

/**
 * Delete a file
 * DELETE /api/files/:fileId
 */
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user._id;

    const file = await File.findById(fileId)
      .populate("group");

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const group = file.group;

    // Only uploader or admin can delete
    const isUploader = file.uploadedBy.toString() === userId.toString();
    const isAdmin = group.isAdmin(userId);

    if (!isUploader && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this file"
      });
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkError) {
        console.error("Error deleting file from disk:", unlinkError);
      }
    }

    // Delete file record
    await File.findByIdAndDelete(fileId);

    // Create system message
    const user = req.user;
    const systemMessage = new Message({
      group: group._id,
      sender: userId,
      content: `${user.name} deleted a file: ${file.originalName}`,
      type: "system"
    });
    await systemMessage.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`group-${group._id}`).emit("file-deleted", {
        fileId: file._id,
        groupId: group._id
      });
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting file",
      error: error.message
    });
  }
};

/**
 * Get file info
 * GET /api/files/:fileId
 */
export const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user._id;

    const file = await File.findById(fileId)
      .populate("group")
      .populate("uploadedBy", "name email profilePicture");

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    // Verify user is group member
    if (!file.group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to view file info"
      });
    }

    res.status(200).json({
      success: true,
      data: { file }
    });
  } catch (error) {
    console.error("Get file info error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching file info",
      error: error.message
    });
  }
};
