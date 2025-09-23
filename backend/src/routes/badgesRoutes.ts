import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getUserBadges } from "../controllers/badges/getUserBadge";
const router = express.Router();

router.get("/userBadges", authMiddleware, getUserBadges);

export default router;
