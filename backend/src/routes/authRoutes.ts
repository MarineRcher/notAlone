import express from "express";
const { register } = require("../controllers/auth/registerController");
const { login } = require("../controllers/auth/loginController")

const router = express.Router();

router.post("/register", register);
router.post("/login", login);


module.exports = router;
