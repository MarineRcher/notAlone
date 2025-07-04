import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import { AddictionUserAttributes } from "../types/addictionUser";
import Addiction from "./Addiction";

interface AddictionUserCreationAttributes
	extends Optional<AddictionUserAttributes, "id_addiction_user"> {}

class AddictionUser
	extends Model<AddictionUserAttributes, AddictionUserCreationAttributes>
	implements AddictionUserAttributes
{
	public id_addiction_user!: string;
	public id_addiction!: string;
	public id_user!: string;
	public date!: Date;
	public spending_a_day!: number;
	public use_a_day!: number;

	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
	declare addiction?: Addiction;

	static associate(models: any) {
		AddictionUser.belongsTo(models.User, {
			foreignKey: "id_user",
			as: "user",
			onDelete: "CASCADE",
		});

		AddictionUser.belongsTo(models.Addiction, {
			foreignKey: "id_addiction",
			as: "addiction",
		});
	}
}

AddictionUser.init(
	{
		id_addiction_user: {
			type: DataTypes.UUID,
			primaryKey: true,
			autoIncrement: true,
			defaultValue: DataTypes.UUIDV4,
		},
		id_addiction: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
		id_user: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
		date: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		spending_a_day: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			validate: { min: 0 },
		},
		use_a_day: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: { min: 0 },
		},
	},
	{
		sequelize: db,
		modelName: "AddictionUser",
		tableName: "addiction_users",
		timestamps: true,
	},
);

export default AddictionUser;
