import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";

export interface SponsorAttributes {
	id: number;
	sponsorId: string;
	userId: string;
	startedAt: Date;
	endedAt?: Date;
	isActive: boolean;
	sponsorPublicKey?: string; // For E2EE communication
	userPublicKey?: string; // For E2EE communication
	keyExchangeComplete: boolean; // Track if both keys are exchanged
	status: 'pending' | 'accepted' | 'rejected';
	createdAt: Date;
	updatedAt: Date;
}

interface SponsorCreationAttributes
	extends Optional<SponsorAttributes, "id" | "endedAt" | "isActive" | "sponsorPublicKey" | "userPublicKey" | "keyExchangeComplete" | "status" | "startedAt" | "createdAt" | "updatedAt"> {}

class Sponsor
	extends Model<SponsorAttributes, SponsorCreationAttributes>
	implements SponsorAttributes
{
	declare id: number;
	declare sponsorId: string;
	declare userId: string;
	declare startedAt: Date;
	declare endedAt?: Date;
	declare isActive: boolean;
	declare sponsorPublicKey?: string;
	declare userPublicKey?: string;
	declare keyExchangeComplete: boolean;
	declare status: 'pending' | 'accepted' | 'rejected';

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

Sponsor.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		sponsorId: {
			type: DataTypes.UUID,
			allowNull: false,
			field: "sponsor_id",
			references: {
				model: "users",
				key: "id",
			},
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			unique: true,
			field: "user_id",
			references: {
				model: "users",
				key: "id",
			},
		},
		startedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
			field: "started_at",
		},
		endedAt: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "ended_at",
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			field: "is_active",
		},
		sponsorPublicKey: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: "sponsor_public_key",
			comment: "Sponsor's public key for E2EE communication",
		},
		userPublicKey: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: "user_public_key",
			comment: "User's public key for E2EE communication",
		},
		keyExchangeComplete: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "key_exchange_complete",
			comment: "Whether both parties have exchanged their public keys",
		},
		status: {
			type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
			defaultValue: 'pending',
			allowNull: false,
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		sequelize: db,
		modelName: "Sponsor",
		tableName: "sponsors",
		timestamps: true,
	},
);

export default Sponsor; 