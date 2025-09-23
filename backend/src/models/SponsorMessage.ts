import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import User from "./User";
import Sponsor from "./Sponsor";

export interface SponsorMessageAttributes {
	id: string;
	sponsorshipId: number;
	senderId: string;
	encryptedContent: string; // The serialized encrypted message
	messageType: "text" | "system" | "key_exchange";
	timestamp: Date;
	isDelivered: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface SponsorMessageCreationAttributes
	extends Optional<
		SponsorMessageAttributes,
		"id" | "messageType" | "isDelivered" | "timestamp" | "createdAt" | "updatedAt"
	> {}

class SponsorMessage
	extends Model<SponsorMessageAttributes, SponsorMessageCreationAttributes>
	implements SponsorMessageAttributes
{
	declare id: string;
	declare sponsorshipId: number;
	declare senderId: string;
	declare encryptedContent: string;
	declare messageType: "text" | "system" | "key_exchange";
	declare timestamp: Date;
	declare isDelivered: boolean;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

SponsorMessage.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
		},
		sponsorshipId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "sponsorship_id",
			references: {
				model: Sponsor,
				key: "id",
			},
			onDelete: "CASCADE",
		},
		senderId: {
			type: DataTypes.UUID,
			allowNull: false,
			field: "sender_id",
			references: {
				model: User,
				key: "id",
			},
			onDelete: "CASCADE",
		},
		encryptedContent: {
			type: DataTypes.TEXT,
			allowNull: false,
			field: "encrypted_content",
			comment: "Serialized encrypted message from frontend",
		},
		messageType: {
			type: DataTypes.ENUM("text", "system", "key_exchange"),
			defaultValue: "text",
			field: "message_type",
		},
		timestamp: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		isDelivered: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "is_delivered",
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			field: "created_at",
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			field: "updated_at",
		},
	},
	{
		sequelize: db,
		modelName: "SponsorMessage",
		tableName: "sponsor_messages",
		timestamps: true,
		indexes: [
			{
				fields: ["sponsorshipId", "timestamp"],
			},
			{
				fields: ["senderId"],
			},
			{
				fields: ["messageType"],
			},
		],
	},
);

// Associations
SponsorMessage.belongsTo(Sponsor, { foreignKey: "sponsorshipId", as: "sponsorship" });
SponsorMessage.belongsTo(User, { foreignKey: "senderId", as: "sender" });

Sponsor.hasMany(SponsorMessage, { foreignKey: "sponsorshipId", as: "messages" });
User.hasMany(SponsorMessage, { foreignKey: "senderId", as: "sponsorMessages" });

export default SponsorMessage; 