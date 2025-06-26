import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import User from "./User";
import Group from "./Group";

export interface MessageAttributes {
	id: string;
	groupId: string;
	senderId: string;
	encryptedContent: string; // The serialized encrypted message
	messageType: "text" | "system" | "key_exchange";
	timestamp: Date;
	isDelivered: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface MessageCreationAttributes
	extends Optional<
		MessageAttributes,
		"id" | "messageType" | "isDelivered" | "createdAt" | "updatedAt"
	> {}

class Message
	extends Model<MessageAttributes, MessageCreationAttributes>
	implements MessageAttributes
{
	declare id: string;
	declare groupId: string;
	declare senderId: string;
	declare encryptedContent: string;
	declare messageType: "text" | "system" | "key_exchange";
	declare timestamp: Date;
	declare isDelivered: boolean;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

Message.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
		},
		groupId: {
			type: DataTypes.UUID,
			allowNull: false,
			field: "group_id", // Map to snake_case database column
			references: {
				model: Group,
				key: "id",
			},
			onDelete: "CASCADE",
		},
		senderId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "sender_id", // Map to snake_case database column
			references: {
				model: User,
				key: "id",
			},
			onDelete: "CASCADE",
		},
		encryptedContent: {
			type: DataTypes.TEXT,
			allowNull: false,
			field: "encrypted_content", // Map to snake_case database column
			comment: "Serialized encrypted message from frontend",
		},
		messageType: {
			type: DataTypes.ENUM("text", "system", "key_exchange"),
			defaultValue: "text",
			field: "message_type", // Map to snake_case database column
		},
		timestamp: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		isDelivered: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "is_delivered", // Map to snake_case database column
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			field: "created_at", // Map to snake_case database column
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			field: "updated_at", // Map to snake_case database column
		},
	},
	{
		sequelize: db,
		modelName: "Message",
		tableName: "messages",
		timestamps: true,
		indexes: [
			{
				fields: ["groupId", "timestamp"],
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
Message.belongsTo(Group, { foreignKey: "groupId", as: "group" });
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });

Group.hasMany(Message, { foreignKey: "groupId", as: "messages" });
User.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });

export default Message;
