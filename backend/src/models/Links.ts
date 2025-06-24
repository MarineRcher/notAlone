import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { AddictionAttributes } from "../types/addiction";
import { Links } from "../types/Links";
import { Url } from "url";

interface LinkCreationAttributes extends Optional<Links, "id_link"> {}

class Link extends Model<Links, LinkCreationAttributes> implements Link {
    declare id_link: number;
    declare name: string;
    declare resume: string;
    declare link: Url;
    declare image_url: Url;
    declare id_addiction: number;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    static associate(models: any) {
        Link.belongsTo(models.Addiction, {
            foreignKey: "id_addiction",
            as: "addiction",
        });
    }
}

Link.init(
    {
        id_link: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
        resume: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
        id_addiction: {
            type: DataTypes.NUMBER,
            allowNull: false,
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        link: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize: db,
        modelName: "Links",
        tableName: "links",
        timestamps: true,
    }
);

export default Link;
