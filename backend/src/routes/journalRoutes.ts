import express from "express";
import { getUserJournal } from "../controllers/journal/GetUserJournalController";
import { authMiddleware } from "../middleware/authMiddleware";
import { addUserDifficulty } from "../controllers/journal/AddUserDifficultyController";
import { addUserConsumed } from "../controllers/journal/AddUserConsumedController";
import { addUserResumeJourney } from "../controllers/journal/AddUserResumeJourneyController";
import { addUserActivities } from "../controllers/journal/AddUserActivitiesController";
import { addUserNote } from "../controllers/journal/AddUserNoteController";
import { addUserGoal } from "../controllers/journal/AddUserGoalController";
const router = express.Router();

router.post("/getJournal", authMiddleware, getUserJournal);
router.post("/addDifficulty", authMiddleware, addUserDifficulty);
router.post("/addConsumed", authMiddleware, addUserConsumed);
router.post("/addResumeJourney", authMiddleware, addUserResumeJourney);
router.post("/addActivities", authMiddleware, addUserActivities);
router.post("/addNote", authMiddleware, addUserNote);
router.post("/addGoal", authMiddleware, addUserGoal);

export default router;
