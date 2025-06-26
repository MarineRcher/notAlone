export interface RoleAttributes {
	id: number;
	name: 'user' | 'sponsor' | 'association';
	description?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface SponsorAttributes {
	id: number;
	sponsorId: string;
	userId: string;
	startedAt: Date;
	endedAt?: Date;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
} 