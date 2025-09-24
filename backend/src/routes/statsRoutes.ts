import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getAcquired } from "../controllers/stats/AcquiredController";


const router = express.Router();

router.post("/acquired", authMiddleware, getAcquired);
export default router;
