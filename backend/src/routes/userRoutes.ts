import express from "express";
import { changeEmail } from "../controllers/user/emailController";
import { deleteUserAccount } from "../controllers/user/deleteUserAccountController";
import {
    activateNotifications,
    deactivateNotifications,
    setNotificationHour,
} from "../controllers/user/notificationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/changeEmail", authMiddleware, changeEmail);
router.delete("/delete", authMiddleware, deleteUserAccount);
router.post("/activateNotifs", authMiddleware, activateNotifications);
router.post("/deactivateNotifs", authMiddleware, deactivateNotifications);
router.post("/hourNotifs", authMiddleware, setNotificationHour);

export default router;
