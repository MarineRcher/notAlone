import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("activities", {
            id_activity: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            activity: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
            },
        });

        await queryInterface.addIndex("activities", ["activity"]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("activities");
    },
};
