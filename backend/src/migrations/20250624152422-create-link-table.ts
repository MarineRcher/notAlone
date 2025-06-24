import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("links", {
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
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "addictions",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            image_url: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            link: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("links");
    },
};
