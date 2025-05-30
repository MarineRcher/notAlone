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
  createdAt: Date;
  updatedAt: Date;
}

interface GroupCreationAttributes
  extends Optional<GroupAttributes, "id" | "isActive" | "currentMembers" | "createdAt" | "updatedAt"> {}

class Group extends Model<GroupAttributes, GroupCreationAttributes> implements GroupAttributes {
  public id!: string;
  public name!: string;
  public isActive!: boolean;
  public maxMembers!: number;
  public currentMembers!: number;
  public isPublic!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 2,
        max: 50,
      },
    },
    currentMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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