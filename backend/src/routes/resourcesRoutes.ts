import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getUserAddictionLinks } from "../controllers/resources/getLinkByUserAddictionController";
import { canAccessAnimation } from "../controllers/resources/canAccessAnimationController";
import { updateLastAnimation } from "../controllers/resources/updateLastAnimationController";


const router = express.Router();

router.get("/getUserAddictionLinks", authMiddleware, getUserAddictionLinks);
router.get("/canAcceessAnimation", authMiddleware, canAccessAnimation);
router.post("/updateLastAnimation", authMiddleware, updateLastAnimation);

export default router;
