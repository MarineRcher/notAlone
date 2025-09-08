import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { forest } from "../types/forest";

interface ForestCreationAttributes extends Optional<forest, "id_forest"> {}

class Forest extends Model<forest, ForestCreationAttributes> implements forest {
	declare id_forest: string;
	declare x: number;
	declare y: number;
	declare id_user: string;
	declare id_nature: string;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

Forest.init(
	{
		id_forest: {
			type: DataTypes.UUID,
			primaryKey: true,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
		x: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		y: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		id_user: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
		id_nature: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
	},
	{
		sequelize: db,
		modelName: "Forest",
		tableName: "forest",
		timestamps: true,
	},
);

export default Forest;
