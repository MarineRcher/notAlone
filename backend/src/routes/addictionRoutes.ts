import express from "express";
import { selectAddictions } from "../controllers/addiction/selectAddictionController";
import { addUserAddiction } from "../controllers/addiction/addUserAddictionController";
import { addAddiction } from "../controllers/addiction/addAddictionController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/all", selectAddictions);
router.post("/addByUser", authMiddleware, addUserAddiction);
router.post("/add", authMiddleware, addAddiction);
export default router;
