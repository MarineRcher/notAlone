import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { platform } from "../types/platform";

interface PlatformCreationAttributes
    extends Optional<platform, "id_platform"> {}

class Platforms
    extends Model<platform, PlatformCreationAttributes>
    implements platform
{
    declare id_platform: number;
    declare x: number;
    declare y: number;
    declare id_user: number;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    static associate(models: any) {
        Platforms.belongsTo(models.User, {
            foreignKey: "id_user",
            as: "user",
            onDelete: "CASCADE",
        });
    }
}

Platforms.init(
    {
        id_platform: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize: db,
        modelName: "Platforms",
        tableName: "platforms",
        timestamps: true,
    }
);

export default Platforms;
