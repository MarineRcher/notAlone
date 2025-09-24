import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getAcquired } from "../controllers/stats/AcquiredController";
import { getMoneySave } from "../controllers/stats/getMoneySave";


const router = express.Router();

router.post("/acquired", authMiddleware, getAcquired);
router.post("/moneySave", authMiddleware, getMoneySave);
export default router;
