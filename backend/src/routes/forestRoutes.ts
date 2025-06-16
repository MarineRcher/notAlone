import express from "express";
import { changeEmail } from "../controllers/user/emailController";
import { deleteUserAccount } from "../controllers/user/deleteUserAccountController";

import { authMiddleware } from "../middleware/authMiddleware";
import { AddUserPlatform } from "../controllers/forest/AddUserPlatformController";
import { GetUserForest } from "../controllers/forest/GetUserForestController";

const router = express.Router();

router.post("/addElement", authMiddleware, AddUserPlatform);
router.post("/getForest", authMiddleware, GetUserForest);

export default router;
