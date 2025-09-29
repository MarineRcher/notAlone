import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import { Acquired as AcquiredAttributes } from "../types/stats";

interface AcquiredCreationAttributes
	extends Optional<AcquiredAttributes, "acquired_id"> {}

class Acquired
	extends Model<AcquiredAttributes, AcquiredCreationAttributes>
	implements AcquiredAttributes
{
	declare acquired_id: string;
	declare addiction_id: string;
	declare acquired: string;
	declare number: number;
	declare unity: string;
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;

	static associate(models: any) {
		Acquired.belongsTo(models.User, {
			foreignKey: "addiction_id",
			as: "addiction",
			onDelete: "CASCADE",
		});
	}
}

Acquired.init(
	{
		acquired_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
		},
		addiction_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		acquired: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		number: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		unity: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		sequelize: db,
		modelName: "Acquired",
		tableName: "acquired",
		timestamps: true,
	},
);

export default Acquired;
