// Noble Signal Protocol Group Routes
// Compatible with the new frontend Noble crypto implementation

import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import GroupService from '../services/GroupService';
import { EncryptedMessage } from '../types/signal';

const router = express.Router();
const groupService = new GroupService();

// Middleware to authenticate JWT tokens
interface AuthenticatedRequest extends Request {
  userId?: number;
  userLogin?: string;
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    
    req.userId = decoded.id || decoded.userId;
    req.userLogin = decoded.login;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};

/**
 * GET /api/noble-groups/stats
 * Get group statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await groupService.getGroupStats();
    res.json({
      success: true,
      stats,
      protocol: 'Noble Signal Protocol'
    });
  } catch (error) {
    console.error('Error getting group stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group statistics'
    });
  }
});

/**
 * POST /api/noble-groups/join-random
 * Join a random group for Signal E2EE chat
 */
router.post('/join-random', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { deviceInfo } = req.body; // Device info from Noble Signal implementation
    
    const result = await groupService.joinRandomGroupWithWaitroom(
      req.userId!, 
      deviceInfo ? JSON.stringify(deviceInfo) : undefined, 
      req.userLogin
    );
    
    if (result.success) {
      res.json({
        success: true,
        group: result.group,
        message: result.message,
        protocol: 'Noble Signal Protocol',
        instructions: 'Use Socket.IO for real-time messaging with E2EE'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error joining random group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/noble-groups/:groupId/leave
 * Leave a group
 */
router.post('/:groupId/leave', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    
    const success = await groupService.leaveGroup(req.userId!, groupId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Successfully left group'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to leave group'
      });
    }
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/noble-groups/:groupId
 * Get group information
 */
router.get('/:groupId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    
    const group = await groupService.getGroupWithMembers(groupId);
    
    res.json({
      success: true,
      group,
      protocol: 'Noble Signal Protocol'
    });
  } catch (error) {
    console.error('Error getting group info:', error);
    res.status(404).json({
      success: false,
      message: 'Group not found'
    });
  }
});

/**
 * GET /api/noble-groups/:groupId/messages
 * Get encrypted group messages (Noble Signal format)
 */
router.get('/:groupId/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const messages = await groupService.getGroupMessages(groupId, limit);
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        senderLogin: (msg as any).sender?.login,
        encryptedData: msg.encryptedContent, // Contains JSON serialized EncryptedMessage
        messageType: msg.messageType,
        timestamp: msg.timestamp,
        protocol: 'Noble Signal'
      })),
      note: 'These are encrypted messages - decrypt using Noble Signal Protocol on client'
    });
  } catch (error) {
    console.error('Error getting group messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
});

/**
 * POST /api/noble-groups/:groupId/messages
 * Send encrypted message (Noble Signal format)
 */
router.post('/:groupId/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { encryptedMessage } = req.body as { encryptedMessage: EncryptedMessage };
    
    if (!encryptedMessage || !encryptedMessage.messageId || !encryptedMessage.encryptedPayload) {
      res.status(400).json({
        success: false,
        message: 'Valid encrypted message (Noble Signal format) is required'
      });
      return;
    }
    
    // Store the encrypted message as JSON
    const message = await groupService.storeMessage(
      groupId,
      req.userId!,
      JSON.stringify(encryptedMessage),
      'text'
    );
    
    res.json({
      success: true,
      messageId: message.id,
      timestamp: message.timestamp,
      protocol: 'Noble Signal Protocol',
      note: 'Message stored encrypted - use Socket.IO for real-time delivery'
    });
    
  } catch (error) {
    console.error('Error storing encrypted message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store message'
    });
  }
});

/**
 * GET /api/noble-groups/test/protocol
 * Test endpoint for Noble Signal Protocol
 */
router.get('/test/protocol', (req: Request, res: Response) => {
  res.json({
    protocol: 'Noble Signal Protocol',
    version: '1.0.0',
    features: [
      'End-to-End Encryption',
      'Double Ratchet Algorithm',
      'Sender Keys for Group Chat',
      'Forward Secrecy',
      'Post-Compromise Security'
    ],
    cryptography: {
      keyExchange: 'X25519 (Curve25519)',
      signing: 'Ed25519',
      encryption: 'ChaCha20Poly1305',
      hashing: 'SHA-256',
      kdf: 'HKDF'
    },
    implementation: 'Pure TypeScript with Noble Cryptography',
    socketEvents: [
      'join_group',
      'leave_group', 
      'group_message',
      'sender_key_distribution',
      'request_sender_key'
    ],
    compatibility: 'React Native / Expo',
    status: 'Active'
  });
});

export default router; 