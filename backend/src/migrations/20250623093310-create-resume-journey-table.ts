import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("resume_journey", {
            id_resume_journey: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            resume_journey: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
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

        await queryInterface.addIndex("resume_journey", ["resume_journey"]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("resume_journey");
    },
};
