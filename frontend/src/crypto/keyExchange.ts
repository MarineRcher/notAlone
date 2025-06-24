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
	public async handleKeyExchange(message: KeyExchangeMessage): Promise<void>
	{
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
		try
		{
			await groupCryptoManager.handleUserJoinGroup(
				groupId,
				newMember,
				existingMembers
			);

			console.log("New member successfully added to group");
		}
		catch (error)
		{
			console.error("Failed to handle new member join:", error);
		}
	}

	public async handleMemberLeave(
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	): Promise<void>
	{
		try
		{
			const result = await groupCryptoManager.handleUserLeaveGroup(
				groupId,
				leavingUserId,
				remainingMembers
			);

			if (result === null)
			{
				console.log("Group disbanded - no members remaining");
			}
			else
			{
				console.log("Member successfully removed from group");
			}
		}
		catch (error)
		{
			console.error("Failed to handle member leave:", error);
		}
	}

	private async processKeyExchange(
		message: KeyExchangeMessage
	): Promise<void>
	{
		console.log("Processing key exchange from user:", message.userId);
	}

	private async processNewMember(message: KeyExchangeMessage): Promise<void>
	{
		console.log("Processing new member notification:", message.userId);
	}

	private async processMemberLeft(
		message: KeyExchangeMessage
	): Promise<void>
	{
		console.log("Processing member left notification:", message.userId);
	}
}

export const keyExchangeHandler = new KeyExchangeHandlerImpl();
