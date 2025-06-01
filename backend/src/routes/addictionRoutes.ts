import express from "express";
import { selectAddictions } from "../controllers/addiction/selectAddictionController";
import { addUserAddiction } from "../controllers/addiction/addUserAddictionController";
import { addAddiction } from "../controllers/addiction/addAddiction";

const router = express.Router();

router.get("/all", selectAddictions);
router.post("/addByUser", addUserAddiction);
router.post("/add", addAddiction);
export default router;
