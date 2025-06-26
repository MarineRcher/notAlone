import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";

export interface RoleAttributes {
	id: number;
	name: 'user' | 'sponsor' | 'association';
	description?: string;
	createdAt: Date;
	updatedAt: Date;
}

interface RoleCreationAttributes
	extends Optional<RoleAttributes, "id" | "description"> {}

class Role
	extends Model<RoleAttributes, RoleCreationAttributes>
	implements RoleAttributes
{
	public id!: number;
	public name!: 'user' | 'sponsor' | 'association';
	public description?: string;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

Role.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		name: {
			type: DataTypes.ENUM('user', 'sponsor', 'association'),
			allowNull: false,
			unique: true,
		},
		description: {
			type: DataTypes.STRING,
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
		modelName: "Role",
		tableName: "roles",
		timestamps: true,
	},
);

export default Role; 