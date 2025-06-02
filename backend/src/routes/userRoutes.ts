import express from "express";
import { changeEmail } from "../controllers/user/emailControlle";

const router = express.Router();

router.post("/changeEmail", changeEmail);
export default router;
