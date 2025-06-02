import express from "express";
import { changeEmail } from "../controllers/user/emailControlle";
import { deleteUserAccount } from "../controllers/user/userController";
import {
    activateNotifications,
    deactivateNotifications,
    setNotificationHour,
} from "../controllers/user/notificationController";

const router = express.Router();

router.post("/changeEmail", changeEmail);
router.delete("/delete", deleteUserAccount);
router.post("/activateNotifs", activateNotifications);
router.post("/deactivateNotifs", deactivateNotifications);
router.post("/hourNotifs", setNotificationHour);

export default router;
