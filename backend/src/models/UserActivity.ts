import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import { UserActivityAttributes } from "../types/journal";

interface UserActivityCreationAttributes
	extends Optional<UserActivityAttributes, "id_activity_user"> {}

class UserActivity
	extends Model<UserActivityAttributes, UserActivityCreationAttributes>
	implements UserActivityAttributes
{
	public id_activity_user!: string;
	public id_activity!: string;
	public id_journal!: string;
	public id_user!: string;

	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;

	static associate(models: any) {
		UserActivity.belongsTo(models.User, {
			foreignKey: "id_user",
			as: "user",
			onDelete: "CASCADE",
		});

		UserActivity.belongsTo(models.Activities, {
			foreignKey: "id_activity",
			as: "activities",
		});
		UserActivity.belongsTo(models.Activities, {
			foreignKey: "id_journal",
			as: "journal",
		});
	}
}

UserActivity.init(
	{
		id_activity_user: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
		},
		id_activity: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
		id_journal: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
		id_user: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4,
		},
	},
	{
		sequelize: db,
		modelName: "UserActivity",
		tableName: "user_activity",
		timestamps: true,
	},
);

export default UserActivity;
