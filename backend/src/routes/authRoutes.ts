import express from "express";
const { register } = require("../controllers/auth/registerController");
const { login } = require("../controllers/auth/loginController")
const { changePassword } = require("../controllers/auth/passwordController")

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/changePassword", changePassword);


module.exports = router;
