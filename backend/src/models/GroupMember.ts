import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import User from "./User";
import Group from "./Group";

export interface GroupMemberAttributes {
  id: string;
  groupId: string;
  userId: number;
  role: 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
  publicKey?: string; // For e2ee key exchange
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GroupMemberCreationAttributes
  extends Optional<GroupMemberAttributes, "id" | "role" | "isActive" | "lastSeenAt" | "createdAt" | "updatedAt"> {}

class GroupMember extends Model<GroupMemberAttributes, GroupMemberCreationAttributes> implements GroupMemberAttributes {
  public id!: string;
  public groupId!: string;
  public userId!: number;
  public role!: 'admin' | 'member';
  public joinedAt!: Date;
  public isActive!: boolean;
  public publicKey?: string;
  public lastSeenAt?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
      references: {
        model: Group,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Base64 encoded public key for e2ee',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: "GroupMember",
    tableName: "group_members",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['groupId', 'userId'],
        name: 'unique_group_user',
      },
      {
        fields: ['userId', 'isActive'],
      },
      {
        fields: ['groupId', 'isActive'],
      },
    ],
  }
);

// Associations
GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members' });
User.hasMany(GroupMember, { foreignKey: 'userId', as: 'groupMemberships' });

export default GroupMember; 