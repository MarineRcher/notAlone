import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import { UserActivityAttributes } from "../types/journal";

interface UserActivityCreationAttributes
    extends Optional<UserActivityAttributes, "id_activity_user"> {}

class UserActivity
    extends Model<UserActivityAttributes, UserActivityCreationAttributes>
    implements UserActivityAttributes
{
    public id_activity_user!: number;
    public id_activity!: number;
    public id_journal!: number;
    public id_user!: number;

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
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id_activity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_journal: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize: db,
        modelName: "UserActivity",
        tableName: "user_activity",
        timestamps: true,
    }
);

export default UserActivity;
