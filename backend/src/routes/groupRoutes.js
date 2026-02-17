import express from "express";
import {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember
} from "../controllers/groupController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Group CRUD
router.post("/", createGroup);
router.get("/", getGroups);
router.get("/:id", getGroup);
router.put("/:id", updateGroup);
router.delete("/:id", deleteGroup);

// Group membership
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);
router.post("/:id/members", addMember);
router.delete("/:id/members/:memberId", removeMember);

export default router;
