import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import { ActivitiesAttributes } from "../types/journal";

interface ActivitiesCreationAttributes
    extends Optional<ActivitiesAttributes, "id_activity"> {}

class Activities
    extends Model<ActivitiesAttributes, ActivitiesCreationAttributes>
    implements ActivitiesAttributes
{
    declare id_activity: string;
    declare activity: string;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Activities.init(
    {
        id_activity: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
        },
        activity: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
    },
    {
        sequelize: db,
        modelName: "Activities",
        tableName: "activities",
        timestamps: true,
    }
);

export default Activities;
