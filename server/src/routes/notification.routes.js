import { Router } from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../services/notification.service.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

// Get notifications for current user
router.get("/", getUserNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.put("/:id/read", markAsRead);

// Mark all as read
router.put("/read-all", markAllAsRead);

export default router;