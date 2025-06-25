import express from "express";
import { changeEmail } from "../controllers/user/emailController";
import { deleteUserAccount } from "../controllers/user/deleteUserAccountController";
import {
	activateNotifications,
	deactivateNotifications,
	setNotificationHour,
} from "../controllers/user/notificationController";
import { authMiddleware } from "../middleware/authMiddleware";
import {
	activatePremium,
	deactivatePremium,
} from "../controllers/user/PremiumController";

const router = express.Router();

router.post("/changeEmail", authMiddleware, changeEmail);
router.delete("/delete", authMiddleware, deleteUserAccount);
router.post("/activateNotifs", authMiddleware, activateNotifications);
router.post("/deactivateNotifs", authMiddleware, deactivateNotifications);
router.post("/hourNotifs", authMiddleware, setNotificationHour);
router.post("/activatePremium", authMiddleware, activatePremium);
router.post("/deactivatePremium", authMiddleware, deactivatePremium);

export default router;
