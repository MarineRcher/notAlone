import express from "express";
const { register } = require("../controllers/auth/registerController");
const { login } = require("../controllers/auth/loginController")
const { changePassword } = require("../controllers/auth/passwordController")
const { 
    generate2FASecret, 
    verify2FASetup, 
    verify2FALogin,
    disable2FA
} = require("../controllers/auth/twoFactorAuthController");
const authMiddleware = require("../middleware/authMiddleware"); 
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/changePassword", changePassword);

router.post("/2fa/generate", authMiddleware, generate2FASecret);
router.post("/2fa/verify-setup", verify2FASetup);
router.post("/2fa/verify-login", verify2FALogin);
router.post("/2fa/disable", authMiddleware, disable2FA);

module.exports = router;
