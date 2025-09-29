import { Model, DataTypes, Optional, IntegerDataType } from "sequelize";
import db from "./../config/database";
import { Url } from "url";
import { badge } from "../types/badges";

interface BadgeCreationAttributes extends Optional<badge, "badge_id"> {}

class Badge extends Model<badge, BadgeCreationAttributes> implements badge {
	declare badge_id: string;
	declare name: string;
	declare time_in_days: number;
	declare url: Url;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

Badge.init(
	{
		badge_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		time_in_days: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		url: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		sequelize: db,
		modelName: "Badge",
		tableName: "badges",
		timestamps: true,
	},
);

export default Badge;
