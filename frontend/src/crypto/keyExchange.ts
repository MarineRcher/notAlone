import { KeyExchangeMessage, GroupMember, UserKeyPair } from "./types";
import { groupCryptoManager } from "./groupCryptoManager";
import { getUserKeyPair } from "./storage";

export interface KeyExchangeHandler {
	handleKeyExchange: (message: KeyExchangeMessage) => Promise<void>;
	sendKeyExchange: (
		groupId: string,
		type: "KEY_EXCHANGE" | "NEW_MEMBER" | "MEMBER_LEFT"
	) => Promise<KeyExchangeMessage | null>;
	handleNewMemberJoin: (
		groupId: string,
		newMember: GroupMember,
		existingMembers: GroupMember[]
	) => Promise<void>;
	handleMemberLeave: (
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	) => Promise<void>;
}

class KeyExchangeHandlerImpl implements KeyExchangeHandler
{
	private pendingKeyExchanges: Map<string, {
		type: "NEW_MEMBER" | "MEMBER_LEFT";
		participants: Set<string>;
		receivedKeys: Map<string, string>;
		expectedCount: number;
		timestamp: number;
		isCompleted: boolean;
		retryCount: number;
	}> = new Map();

	private readonly KEY_EXCHANGE_TIMEOUT = 30000; // 30 seconds
	private readonly MAX_RETRIES = 3;
	private keyExchangeLocks: Map<string, boolean> = new Map(); // Group-level locks

	public async handleKeyExchange(message: KeyExchangeMessage): Promise<void>
	{
		console.log(`🔄 Processing key exchange: ${message.type} from ${message.userId}`);
		
		// Check if group is locked for key exchange
		if (this.keyExchangeLocks.get(message.groupId)) {
			console.log(`🔒 Group ${message.groupId} is locked for key exchange, queueing message`);
			// For now, we'll skip duplicate messages during active exchange
			return;
		}
		
		switch (message.type)
		{
			case "KEY_EXCHANGE":
				await this.processKeyExchange(message);
				break;
			case "NEW_MEMBER":
				await this.processNewMember(message);
				break;
			case "MEMBER_LEFT":
				await this.processMemberLeft(message);
				break;
			default:
				console.warn("Unknown key exchange message type");
		}
	}

	public async sendKeyExchange(
		groupId: string,
		type: "KEY_EXCHANGE" | "NEW_MEMBER" | "MEMBER_LEFT"
	): Promise<KeyExchangeMessage | null>
	{
		const userKeyPair = await getUserKeyPair();

		if (!userKeyPair)
		{
			console.error("No user key pair found");
			return null;
		}

		const message: KeyExchangeMessage = {
			type,
			userId: userKeyPair.userId,
			publicKey: userKeyPair.publicKey,
			groupId,
			timestamp: new Date()
		};

		return message;
	}

	public async handleNewMemberJoin(
		groupId: string,
		newMember: GroupMember,
		existingMembers: GroupMember[]
	): Promise<void>
	{
		console.log(`👤 New member ${newMember.userId} joining group ${groupId}`);
		
		// Check if already locked
		if (this.keyExchangeLocks.get(groupId)) {
			console.log(`🔒 Key exchange already in progress for group ${groupId}, skipping`);
			return;
		}
		
		try 
		{
			// Lock the group for key exchange
			this.keyExchangeLocks.set(groupId, true);
			
			// Get current user's key pair
			const userKeyPair = await getUserKeyPair();
			if (!userKeyPair) {
				throw new Error("No user key pair found");
			}

			// Create a new key exchange session with ALL members (including the new member)
			const allMembers = [...existingMembers, newMember];
			const activeMembers = allMembers.filter(m => m.isActive);
			
			// Clear any existing exchange for this group to prevent conflicts
			this.pendingKeyExchanges.delete(groupId);
			
			// Create a new key exchange session
			this.pendingKeyExchanges.set(groupId, {
				type: "NEW_MEMBER",
				participants: new Set(activeMembers.map(m => m.userId)),
				receivedKeys: new Map(),
				expectedCount: activeMembers.length,
				timestamp: Date.now(),
				isCompleted: false,
				retryCount: 0
			});

			console.log(`🔄 Starting key exchange for ${activeMembers.length} members: ${activeMembers.map(m => m.userId).join(', ')}`);
			
			// Send our public key to all members
			const keyExchangeMessage = await this.sendKeyExchange(groupId, "NEW_MEMBER");
			if (keyExchangeMessage) {
				// This will be sent via socket by the caller
				console.log(`📤 Sending public key for new member key exchange`);
			}
		} catch (error) {
			console.error("Failed to handle new member join:", error);
			// Release lock on error
			this.keyExchangeLocks.delete(groupId);
		}
	}

	public async handleMemberLeave(
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	): Promise<void>
	{
		console.log(`👋 Member ${leavingUserId} leaving group ${groupId}`);
		
		// Check if already locked
		if (this.keyExchangeLocks.get(groupId)) {
			console.log(`🔒 Key exchange already in progress for group ${groupId}, skipping`);
			return;
		}
		
		try 
		{
			// Lock the group for key exchange
			this.keyExchangeLocks.set(groupId, true);
			
			// Get current user's key pair
			const userKeyPair = await getUserKeyPair();
			if (!userKeyPair) {
				throw new Error("No user key pair found");
			}

			// Create a new key exchange session
			const activeMembers = remainingMembers.filter(m => m.isActive);
			
			this.pendingKeyExchanges.set(groupId, {
				type: "MEMBER_LEFT",
				participants: new Set(activeMembers.map(m => m.userId)),
				receivedKeys: new Map(),
				expectedCount: activeMembers.length,
				timestamp: Date.now(),
				isCompleted: false,
				retryCount: 0
			});

			console.log(`🔄 Starting key exchange for ${activeMembers.length} remaining members`);
			
			// Send our public key to all remaining members
			const keyExchangeMessage = await this.sendKeyExchange(groupId, "MEMBER_LEFT");
			if (keyExchangeMessage) {
				// This will be sent via socket by the caller
				console.log(`📤 Sending public key for member leave key exchange`);
			}
		} catch (error) {
			console.error("Failed to handle member leave:", error);
			// Release lock on error
			this.keyExchangeLocks.delete(groupId);
		}
	}

	private async processKeyExchange(
		message: KeyExchangeMessage
	): Promise<void>
	{
		console.log(`🔄 Processing key exchange from user: ${message.userId}`);
		
		// For basic key exchange, we just acknowledge receipt
		// The actual key generation happens in processNewMember/processMemberLeft
	}

	private async processNewMember(message: KeyExchangeMessage): Promise<void>
	{
		console.log(`👤 Processing new member key exchange from: ${message.userId}`);
		
		const exchange = this.pendingKeyExchanges.get(message.groupId);
		if (!exchange || exchange.type !== "NEW_MEMBER") {
			console.warn(`❌ No pending NEW_MEMBER exchange for group ${message.groupId}`);
			return;
		}

		// Check if we already have this user's key to prevent duplicates
		if (exchange.receivedKeys.has(message.userId)) {
			console.log(`🔄 Already received key from ${message.userId}, skipping duplicate`);
			return;
		}

		// Add the received public key
		exchange.receivedKeys.set(message.userId, message.publicKey);
		console.log(`📥 Received key from ${message.userId}, total: ${exchange.receivedKeys.size}/${exchange.expectedCount}`);
		console.log(`📋 Received keys from: ${Array.from(exchange.receivedKeys.keys()).join(', ')}`);
		console.log(`📋 Expected participants: ${Array.from(exchange.participants).join(', ')}`);

		// Check if we have all keys from all participants
		if (exchange.receivedKeys.size === exchange.expectedCount) {
			console.log(`🎯 All keys received for synchronized key exchange in group ${message.groupId}`);
			await this.finalizeKeyExchange(message.groupId, exchange);
		} else {
			console.log(`⏳ Waiting for more keys: ${exchange.receivedKeys.size}/${exchange.expectedCount}`);
			const missingUsers = Array.from(exchange.participants).filter(userId => !exchange.receivedKeys.has(userId));
			console.log(`⏳ Missing keys from: ${missingUsers.join(', ')}`);
		}
	}

	private async processMemberLeft(
		message: KeyExchangeMessage
	): Promise<void>
	{
		console.log(`👋 Processing member left key exchange from: ${message.userId}`);
		
		const exchange = this.pendingKeyExchanges.get(message.groupId);
		if (!exchange || exchange.type !== "MEMBER_LEFT") {
			console.warn(`❌ No pending MEMBER_LEFT exchange for group ${message.groupId}`);
			return;
		}

		// Add the received public key
		exchange.receivedKeys.set(message.userId, message.publicKey);
		console.log(`📥 Received key from ${message.userId}, total: ${exchange.receivedKeys.size}/${exchange.expectedCount}`);

		// Check if we have all keys
		if (exchange.receivedKeys.size === exchange.expectedCount) {
			await this.finalizeKeyExchange(message.groupId, exchange);
		}
	}

	private async finalizeKeyExchange(groupId: string, exchange: any): Promise<void>
	{
		console.log(`🎯 Finalizing synchronized key exchange for group ${groupId}`);
		
		// Check if already completed to prevent duplicate processing
		if (exchange.isCompleted) {
			console.log(`✅ Key exchange for group ${groupId} already completed`);
			return;
		}
		
		try 
		{
			// Mark as completed first to prevent race conditions
			exchange.isCompleted = true;
			
			// Convert received keys to GroupMember format
			const members: GroupMember[] = [];
			exchange.receivedKeys.forEach((publicKey: string, userId: string) => {
				members.push({
					userId,
					publicKey,
					isActive: true
				});
			});

			console.log(`🔑 Finalizing key exchange with ${members.length} members: ${members.map(m => m.userId).join(', ')}`);

			// Use synchronized key exchange for both NEW_MEMBER and MEMBER_LEFT
			const groupKeyInfo = await groupCryptoManager.handleSynchronizedKeyExchange(
				groupId,
				members
			);
			
			console.log(`✅ Synchronized key exchange completed for group ${groupId}, key version: ${groupKeyInfo.keyVersion}`);

			// Send acknowledgment that key exchange is complete
			this.sendKeyExchangeAcknowledgment(groupId, exchange.type);

			// Clean up the exchange and release the lock
			this.pendingKeyExchanges.delete(groupId);
			this.keyExchangeLocks.delete(groupId);
			
		} catch (error) {
			console.error("Failed to finalize key exchange:", error);
			
			// Reset completion status to allow retry
			exchange.isCompleted = false;
			exchange.retryCount = (exchange.retryCount || 0) + 1;
			
			if (exchange.retryCount >= this.MAX_RETRIES) {
				console.error(`❌ Key exchange for group ${groupId} failed after ${this.MAX_RETRIES} retries`);
				this.pendingKeyExchanges.delete(groupId);
				this.keyExchangeLocks.delete(groupId);
			} else {
				console.log(`🔄 Retrying key exchange for group ${groupId} (attempt ${exchange.retryCount + 1})`);
				// Reset for retry but keep the lock
				exchange.receivedKeys.clear();
				exchange.timestamp = Date.now();
			}
		}
	}

	private sendKeyExchangeAcknowledgment(groupId: string, type: "NEW_MEMBER" | "MEMBER_LEFT"): void {
		console.log(`📤 Sending key exchange acknowledgment for ${type} in group ${groupId}`);
		// This will be handled by the socket layer
		// For now, just log the completion
	}

	// Cleanup expired exchanges and release locks
	public cleanupExpiredExchanges(): void {
		const now = Date.now();
		for (const [groupId, exchange] of this.pendingKeyExchanges.entries()) {
			if (now - exchange.timestamp > this.KEY_EXCHANGE_TIMEOUT) {
				console.warn(`⏰ Key exchange for group ${groupId} expired after ${this.KEY_EXCHANGE_TIMEOUT}ms`);
				console.warn(`📊 Exchange details: ${exchange.receivedKeys.size}/${exchange.expectedCount} keys received`);
				console.warn(`📋 Received from: ${Array.from(exchange.receivedKeys.keys()).join(', ')}`);
				console.warn(`📋 Expected from: ${Array.from(exchange.participants).join(', ')}`);
				
				// Clean up expired exchange and release lock
				this.pendingKeyExchanges.delete(groupId);
				this.keyExchangeLocks.delete(groupId);
			}
		}
	}
}

export const keyExchangeHandler = new KeyExchangeHandlerImpl();
