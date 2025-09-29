import apiClient from './apiClient';

export interface SponsorshipInfo {
	hasSponsor: boolean;
	sponsorship?: {
		id: number;
		sponsorId: string;
		userId: string;
		status: 'pending' | 'accepted' | 'rejected';
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
		status: 'pending' | 'accepted' | 'rejected';
		user?: {
			id: string;
			login: string;
			email: string;
		};
	}>;
	sponsorCode?: string;
	pendingRequests: Array<{
		id: number;
		sponsorId: string;
		userId: string;
		status: 'pending';
		user?: {
			id: string;
			login: string;
			email: string;
		};
	}>;
}

export interface PendingRequests {
	incomingRequests: Array<{
		id: number;
		sponsorId: string;
		userId: string;
		status: 'pending';
		user?: {
			id: string;
			login: string;
			email: string;
		};
	}>;
	outgoingRequest?: {
		id: number;
		sponsorId: string;
		userId: string;
		status: 'pending';
		sponsor?: {
			id: string;
			login: string;
			email: string;
		};
	};
}

export interface SponsorMessage {
	id: string;
	sponsorshipId: number;
	senderId: string;
	encryptedContent: string; // Now stores plain text content
	messageType: 'text' | 'system';
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

	// Request sponsorship using sponsor code
	async requestSponsor(sponsorCode: string): Promise<{ message: string; sponsorship: any }> {
		const response = await apiClient.post('/sponsor-chat/request', {
			sponsorCode,
		});
		return response.data.data;
	},

	// Respond to a sponsor request (accept/reject)
	async respondToSponsorRequest(sponsorshipId: number, action: 'accept' | 'reject'): Promise<{ message: string; sponsorship: any }> {
		const response = await apiClient.post('/sponsor-chat/respond', {
			sponsorshipId,
			action,
		});
		return response.data.data;
	},

	// Get pending sponsor requests
	async getPendingSponsorRequests(): Promise<PendingRequests> {
		const response = await apiClient.get('/sponsor-chat/pending');
		return response.data.data;
	},

	// Remove sponsor relationship
	async removeSponsor(sponsorshipId: number): Promise<{ message: string }> {
		const response = await apiClient.delete(`/sponsor-chat/${sponsorshipId}`);
		return response.data.data;
	},

	// Check for sponsor status updates
	async checkSponsorStatusUpdates(): Promise<{ acceptedSponsorships: any[]; rejectedRequests: any[] }> {
		const response = await apiClient.get('/sponsor-chat/status-updates');
		return response.data.data;
	},

	// Get messages for a sponsorship
	async getMessages(sponsorshipId: number): Promise<{ messages: SponsorMessage[]; sponsorship: any }> {
		const response = await apiClient.get(`/sponsor-chat/${sponsorshipId}/messages`);
		return response.data.data;
	},

	// Send a message
	async sendMessage(sponsorshipId: number, content: string, messageType: 'text' | 'system' = 'text'): Promise<SponsorMessage> {
		const response = await apiClient.post('/sponsor-chat/messages', {
			sponsorshipId,
			content,
			messageType,
		});
		return response.data.data;
	},
};

export default sponsorService; 