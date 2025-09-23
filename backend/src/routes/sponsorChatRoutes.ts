import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import SponsorChatController from "../controllers/SponsorChatController";

const router = Router();

// Get sponsorship info for current user
router.get("/info", authMiddleware, SponsorChatController.getSponsorshipInfo);

// Sponsor request workflow
router.post("/request", authMiddleware, SponsorChatController.requestSponsor);
router.post("/respond", authMiddleware, SponsorChatController.respondToSponsorRequest);
router.get("/pending", authMiddleware, SponsorChatController.getPendingSponsorRequests);
router.get("/status-updates", authMiddleware, SponsorChatController.checkSponsorStatusUpdates);
router.delete("/:sponsorshipId", authMiddleware, SponsorChatController.removeSponsor);

// Update public key for encryption
router.post("/key", authMiddleware, SponsorChatController.updatePublicKey);

// Get messages for a sponsorship
router.get("/:sponsorshipId/messages", authMiddleware, SponsorChatController.getMessages);

// Send a message
router.post("/messages", authMiddleware, SponsorChatController.sendMessage);

export default router; 