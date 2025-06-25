import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import User from "./User";
import Group from "./Group";

export interface GroupMemberAttributes {
	id: string;
	groupId: string;
	userId: number;
	role: "admin" | "member";
	joinedAt: Date;
	isActive: boolean;
	publicKey?: string; // For e2ee key exchange
	lastSeenAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

interface GroupMemberCreationAttributes
	extends Optional<
		GroupMemberAttributes,
		"id" | "role" | "isActive" | "lastSeenAt" | "createdAt" | "updatedAt"
	> {}

class GroupMember
	extends Model<GroupMemberAttributes, GroupMemberCreationAttributes>
	implements GroupMemberAttributes
{
	declare id: string;
	declare groupId: string;
	declare userId: number;
	declare role: "admin" | "member";
	declare joinedAt: Date;
	declare isActive: boolean;
	declare publicKey?: string;
	declare lastSeenAt?: Date;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

GroupMember.init(
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
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "user_id", // Map to snake_case database column
			references: {
				model: User,
				key: "id",
			},
			onDelete: "CASCADE",
		},
		role: {
			type: DataTypes.ENUM("admin", "member"),
			defaultValue: "member",
		},
		joinedAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			field: "joined_at", // Map to snake_case database column
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			field: "is_active", // Map to snake_case database column
		},
		publicKey: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: "public_key", // Map to snake_case database column
			comment: "Base64 encoded public key for e2ee",
		},
		lastSeenAt: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "last_seen_at", // Map to snake_case database column
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
		modelName: "GroupMember",
		tableName: "group_members",
		timestamps: true,
		indexes: [
			{
				unique: true,
				fields: ["groupId", "userId"],
				name: "unique_group_user",
			},
			{
				fields: ["userId", "isActive"],
			},
			{
				fields: ["groupId", "isActive"],
			},
		],
	},
);

// Associations
GroupMember.belongsTo(Group, { foreignKey: "groupId", as: "group" });
GroupMember.belongsTo(User, { foreignKey: "userId", as: "user" });

Group.hasMany(GroupMember, { foreignKey: "groupId", as: "members" });
User.hasMany(GroupMember, { foreignKey: "userId", as: "groupMemberships" });

export default GroupMember;
