import express from "express";
import { getUserForest } from "../controllers/games/GetUserForest";
import { authMiddleware } from "../middleware/authMiddleware";
import { getNatureByTree } from "../controllers/games/GetNatureByTree";
import { getNatureByFlower } from "../controllers/games/GetNatureByFlower";
import { addNatureElement } from "../controllers/games/AddNatureElement";
import { getUserPoints } from "../controllers/games/getUserPoints";
const router = express.Router();

router.get("/userForest", authMiddleware, getUserForest);
router.get("/trees", authMiddleware, getNatureByTree);
router.get("/flowers", authMiddleware, getNatureByFlower);
router.post("/addNature", authMiddleware, addNatureElement);
router.get("/points", authMiddleware, getUserPoints);

export default router;
