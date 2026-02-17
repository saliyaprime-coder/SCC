import express from "express";
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction
} from "../controllers/messageController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Group messages
router.post("/groups/:groupId/messages", sendMessage);
router.get("/groups/:groupId/messages", getMessages);

// Message actions
router.put("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", deleteMessage);
router.post("/messages/:messageId/reactions", addReaction);
router.delete("/messages/:messageId/reactions", removeReaction);

export default router;
