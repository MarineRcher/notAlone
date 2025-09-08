import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { nature } from "../types/forest";
import { Url } from "url";

interface NatureCreationAttributes extends Optional<nature, "id_nature"> {}

class Nature extends Model<nature, NatureCreationAttributes> implements nature {
	declare id_nature: string;
	declare name: string;
	declare type: "tree" | "flower";
	declare url: Url;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

Nature.init(
	{
		id_nature: {
			type: DataTypes.UUID,
			primaryKey: true,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		type: {
			type: DataTypes.ENUM("tree", "flower"),
			allowNull: false,
		},
		url: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		sequelize: db,
		modelName: "Nature",
		tableName: "natures",
		timestamps: true,
	},
);

export default Nature;
