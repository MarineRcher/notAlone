import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import User from "./User";
import Group from "./Group";

export interface MessageAttributes {
  id: string;
  groupId: string;
  senderId: number;
  encryptedContent: string; // The serialized encrypted message
  messageType: 'text' | 'system' | 'key_exchange';
  timestamp: Date;
  isDelivered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageCreationAttributes
  extends Optional<MessageAttributes, "id" | "messageType" | "isDelivered" | "createdAt" | "updatedAt"> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public groupId!: string;
  public senderId!: number;
  public encryptedContent!: string;
  public messageType!: 'text' | 'system' | 'key_exchange';
  public timestamp!: Date;
  public isDelivered!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
      references: {
        model: Group,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    encryptedContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Serialized encrypted message from frontend',
    },
    messageType: {
      type: DataTypes.ENUM('text', 'system', 'key_exchange'),
      defaultValue: 'text',
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    modelName: "Message",
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        fields: ['groupId', 'timestamp'],
      },
      {
        fields: ['senderId'],
      },
      {
        fields: ['messageType'],
      },
    ],
  }
);

// Associations
Message.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Group.hasMany(Message, { foreignKey: 'groupId', as: 'messages' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });

export default Message; 