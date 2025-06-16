import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { nature } from "../types/forest";
import { Url } from "url";

interface NatureCreationAttributes extends Optional<nature, "id_nature"> {}

class Nature extends Model<nature, NatureCreationAttributes> implements nature {
    declare id_nature: number;
    declare type: "tree" | "flower";
    declare url: Url;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Nature.init(
    {
        id_nature: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: DataTypes.ENUM("tree", "flower"),
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize: db,
        modelName: "Nature",
        tableName: "nature",
        timestamps: true,
    }
);

export default Nature;
