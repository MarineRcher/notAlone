import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { forest } from "../types/forest";
import Platforms from "./Platforms";
import Nature from "./Nature";

interface ForestCreationAttributes extends Optional<forest, "id_forest"> {}

class Forest extends Model<forest, ForestCreationAttributes> implements forest {
    declare id_forest: number;
    declare side: "top" | "right" | "bottom" | "left";
    declare id_platform: number;
    declare id_nature: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    static associate(models: any) {
        Forest.belongsTo(Platforms, {
            foreignKey: "id_platform",
            as: "platform",
            onDelete: "CASCADE",
        });

        Forest.belongsTo(Nature, {
            foreignKey: "id_nature",
            as: "nature",
            onDelete: "RESTRICT",
        });
    }
}

Forest.init(
    {
        id_forest: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        side: {
            type: DataTypes.ENUM("top", "right", "bottom", "left"),
            allowNull: false,
        },
        id_platform: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_nature: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize: db,
        modelName: "Forest",
        tableName: "forest",
        timestamps: true,
    }
);

export default Forest;
