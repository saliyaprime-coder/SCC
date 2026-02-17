import express from "express";
import {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  getFileInfo
} from "../controllers/fileController.js";
import { authenticate } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Group files
router.post("/groups/:groupId/files", upload.single("file"), uploadFile);
router.get("/groups/:groupId/files", getFiles);

// File actions
router.get("/files/:fileId", getFileInfo);
router.get("/files/:fileId/download", downloadFile);
router.delete("/files/:fileId", deleteFile);

export default router;
