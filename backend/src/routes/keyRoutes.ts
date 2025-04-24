// src/routes/keyRoutes.ts - Simplified version
import express from 'express';
import { GroupService } from '../services/GroupService';

// Create a router
const router = express.Router();
const groupService = new GroupService();

// Get a user's public key
router.get('/users/:userId/public-key', (req, res) => {
    try {
        const { userId } = req.params;
        const publicKey = groupService.getUserPublicKey(userId);
        
        if (!publicKey) {
            return res.status(404).json({ error: 'Public key not found' });
        }
        
        res.json({ userId, publicKey });
    } catch (error) {
        console.error('Error retrieving public key:', error);
        res.status(500).json({ error: 'Failed to retrieve public key' });
    }
});

// Publish a user's public key
router.post('/users/:userId/public-key', (req, res) => {
    try {
        const { userId } = req.params;
        const { publicKey } = req.body;
        
        if (!publicKey) {
            return res.status(400).json({ error: 'Public key is required' });
        }
        
        groupService.storeUserPublicKey(userId, publicKey);
        res.status(201).json({ message: 'Public key stored successfully' });
    } catch (error) {
        console.error('Error storing public key:', error);
        res.status(500).json({ error: 'Failed to store public key' });
    }
});

// Get all public keys for a room's members
router.get('/rooms/:roomId/public-keys', (req, res) => {
    try {
        const { roomId } = req.params;
        const memberKeys = groupService.getRoomMemberPublicKeys(roomId);
        
        // Convert Map to a regular object for JSON response
        const keysObject: Record<string, string> = {};
        memberKeys.forEach((value, key) => {
            keysObject[key] = value;
        });
        
        res.json({ roomId, memberKeys: keysObject });
    } catch (error) {
        console.error('Error retrieving room member public keys:', error);
        res.status(500).json({ error: 'Failed to retrieve public keys' });
    }
});

// Make sure to export the router (this is critical)
export default router;