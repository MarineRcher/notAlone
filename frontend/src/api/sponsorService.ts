import apiClient from './apiClient';

export interface SponsorshipInfo {
	hasSponsor: boolean;
	sponsorship?: {
		id: number;
		sponsorId: string;
		userId: string;
		sponsorPublicKey?: string;
		userPublicKey?: string;
		keyExchangeComplete: boolean;
		sponsor?: {
			id: string;
			login: string;
			email: string;
		};
	};
	isSponsoring: boolean;
	sponsoredUsers: Array<{
		id: number;
		sponsorId: string;
		userId: string;
		sponsorPublicKey?: string;
		userPublicKey?: string;
		keyExchangeComplete: boolean;
		user?: {
			id: string;
			login: string;
			email: string;
		};
	}>;
}

export interface SponsorMessage {
	id: string;
	sponsorshipId: number;
	senderId: string;
	encryptedContent: string;
	messageType: 'text' | 'system' | 'key_exchange';
	timestamp: string;
	isDelivered: boolean;
	sender?: {
		id: string;
		login: string;
	};
}

const sponsorService = {
	// Get sponsorship information for current user
	async getSponsorshipInfo(): Promise<SponsorshipInfo> {
		const response = await apiClient.get('/sponsor-chat/info');
		return response.data.data;
	},

	// Update public key for encryption
	async updatePublicKey(sponsorshipId: number, publicKey: string): Promise<{ keyExchangeComplete: boolean }> {
		const response = await apiClient.post('/sponsor-chat/key', {
			sponsorshipId,
			publicKey,
		});
		return response.data.data;
	},

	// Get messages for a sponsorship
	async getMessages(sponsorshipId: number): Promise<{ messages: SponsorMessage[]; sponsorship: any }> {
		const response = await apiClient.get(`/sponsor-chat/${sponsorshipId}/messages`);
		return response.data.data;
	},

	// Send a message
	async sendMessage(sponsorshipId: number, encryptedContent: string, messageType: 'text' | 'system' | 'key_exchange' = 'text'): Promise<SponsorMessage> {
		const response = await apiClient.post('/sponsor-chat/messages', {
			sponsorshipId,
			encryptedContent,
			messageType,
		});
		return response.data.data;
	},
};

export default sponsorService; 