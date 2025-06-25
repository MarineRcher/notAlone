import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        const now = new Date();
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
            phone_number: {
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

        await queryInterface.bulkInsert("addictions", [
            {
                addiction: "Tabac",
                phone_number: "3989",
                created_at: now,
                updated_at: now,
            },
            {
                addiction: "Alcool",
                phone_number: "0969394020",
                created_at: now,
                updated_at: now,
            },
            {
                addiction: "Jeux d'argent",
                phone_number: "0974751313",
                created_at: now,
                updated_at: now,
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("addictions");
    },
};
