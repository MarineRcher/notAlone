// src/models/addiction.ts
import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { AddictionAttributes } from "../types/addiction";

interface AddictionCreationAttributes
    extends Optional<AddictionAttributes, "id"> {}

class Addiction
    extends Model<AddictionAttributes, AddictionCreationAttributes>
    implements AddictionAttributes
{
    declare id: number;
    declare addiction: string;
    declare phoneNumber: string;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Addiction.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        addiction: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
        phoneNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [4, 20],
            },
        },
    },
    {
        sequelize: db,
        modelName: "Addiction",
        tableName: "addictions",
        timestamps: true,
    }
);

export default Addiction;
