import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import User from "./User";

export interface GroupAttributes {
  id: string;
  name: string;
  isActive: boolean;
  maxMembers: number;
  currentMembers: number;
  isPublic: boolean;
  status: 'waiting' | 'active' | 'sealed' | 'inactive';
  minMembersToStart: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GroupCreationAttributes
  extends Optional<GroupAttributes, "id" | "isActive" | "currentMembers" | "status" | "minMembersToStart" | "createdAt" | "updatedAt"> {}

class Group extends Model<GroupAttributes, GroupCreationAttributes> implements GroupAttributes {
  declare id: string;
  declare name: string;
  declare isActive: boolean;
  declare maxMembers: number;
  declare currentMembers: number;
  declare isPublic: boolean;
  declare status: 'waiting' | 'active' | 'sealed' | 'inactive';
  declare minMembersToStart: number;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Group.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active', // Map to snake_case database column
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'max_members', // Map to snake_case database column
      validate: {
        min: 2,
        max: 50,
      },
    },
    currentMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'current_members', // Map to snake_case database column
      validate: {
        min: 0,
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_public', // Map to snake_case database column
    },
    status: {
      type: DataTypes.ENUM('waiting', 'active', 'sealed', 'inactive'),
      allowNull: false,
      defaultValue: 'waiting',
    },
    minMembersToStart: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      field: 'min_members_to_start', // Map to snake_case database column
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at', // Map to snake_case database column
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at', // Map to snake_case database column
    },
  },
  {
    sequelize: db,
    modelName: "Group",
    tableName: "groups",
    timestamps: true,
    indexes: [
      {
        fields: ['isActive', 'isPublic'],
      },
      {
        fields: ['currentMembers', 'maxMembers'],
      },
    ],
  }
);

export default Group; 