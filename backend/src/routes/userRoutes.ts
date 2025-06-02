import express from "express";
import { changeEmail } from "../controllers/user/emailControlle";
import { deleteUserAccount } from "../controllers/user/userController";

const router = express.Router();

router.post("/changeEmail", changeEmail);

router.delete("/delete", deleteUserAccount);
export default router;
