import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { AddictionUserAttributes } from "../types/addictionUser";
import User from "./User";
import Addiction from "./Addiction";

interface AddictionUserCreationAttributes
    extends Optional<AddictionUserAttributes, "id_addiction_user"> {}

class AddictionUser
    extends Model<AddictionUserAttributes, AddictionUserCreationAttributes>
    implements AddictionUserAttributes
{
    public id_addiction_user!: number;
    public id_addiction!: number;
    public id_user!: number;
    public date!: Date;
    public spending_a_day!: number;
    public use_a_day!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

AddictionUser.init(
    {
        id_addiction_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id_addiction: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Addiction,
                key: "id",
            },
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        spending_a_day: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        use_a_day: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
    },
    {
        sequelize: db,
        modelName: "AddictionUser",
        tableName: "addiction_users",
        timestamps: true,
    }
);

AddictionUser.belongsTo(User, {
    foreignKey: "id_user",
    as: "user",
});

AddictionUser.belongsTo(Addiction, {
    foreignKey: "id_addiction",
    as: "addiction",
});

User.hasMany(AddictionUser, {
    foreignKey: "id_user",
    as: "addictionUsers",
});

Addiction.hasMany(AddictionUser, {
    foreignKey: "id_addiction",
    as: "addictionUsers",
});

export default AddictionUser;
