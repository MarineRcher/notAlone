import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { Links } from "../types/Links";
import { Url } from "url";

interface LinkCreationAttributes extends Optional<Links, "id_link"> {}

class Link extends Model<Links, LinkCreationAttributes> implements Link {
    declare id_link: string;
    declare name: string;
    declare resume: string;
    declare link: Url;
    declare name_link: string;
    declare image_url: Url;
    declare id_addiction: string;

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
            type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
        name_link:{
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
            type: DataTypes.UUID,
            allowNull: false,
			defaultValue: DataTypes.UUIDV4,
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
