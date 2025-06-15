import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("addictions", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            addiction: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            phoneNumber: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        });

        await queryInterface.addIndex("addictions", ["addiction"]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("addictions");
    },
};
