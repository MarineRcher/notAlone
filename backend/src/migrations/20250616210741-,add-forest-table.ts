import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("forest", {
        id_forest: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        side: {
            type: DataTypes.ENUM("top", "right", "bottom", "left"),
            allowNull: false,
        },
        id_platform: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "platforms",
                key: "id_platform",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        id_nature: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "nature",
                key: "id_nature",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });
};
export const down = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("forest");
};
