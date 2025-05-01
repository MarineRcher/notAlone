import express from "express";
import { register } from "../controllers/auth/registerController";
import { login } from "../controllers/auth/loginController";
import { changePassword } from "../controllers/auth/passwordController";
import {
    generate2FASecret,
    verify2FASetup,
    verify2FALogin,
    disable2FA,
} from "../controllers/auth/twoFactorAuthController";
import { authMiddleware } from "../middleware/authMiddleware";
import { getCurrentUser } from "../controllers/auth/meController";
import { logout } from "../controllers/auth/logoutController";
import { checkBlockedStatus } from "../middleware/checkBlockedStatus";
const router = express.Router();

router.get("/me", authMiddleware, getCurrentUser);

router.post("/register", register);
router.post("/login", checkBlockedStatus, login);
router.post("/changePassword", checkBlockedStatus, changePassword);
router.post("/refresh", changePassword);
router.post("/logout", authMiddleware, logout);
router.post("/2fa/generate", authMiddleware, generate2FASecret);
router.post("/2fa/verify-setup", authMiddleware, verify2FASetup);
router.post("/2fa/verify-login", verify2FALogin);
router.post("/2fa/disable", authMiddleware, disable2FA);

export default router;
