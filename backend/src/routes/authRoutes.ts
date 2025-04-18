import express from 'express';
import { register } from '../controllers/auth/registerController';
import { login } from '../controllers/auth/loginController';
import { changePassword } from '../controllers/auth/passwordController';
import { 
    generate2FASecret, 
    verify2FASetup, 
    verify2FALogin,
    disable2FA
} from '../controllers/auth/twoFactorAuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/changePassword", changePassword);

router.post("/2fa/generate", authMiddleware, generate2FASecret);
router.post("/2fa/verify-setup", verify2FASetup);
router.post("/2fa/verify-login", verify2FALogin);
router.post("/2fa/disable", authMiddleware, disable2FA);

export default router;