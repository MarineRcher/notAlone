import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("journal", {
            id_journal: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            id_user: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            difficulty: {
                type: DataTypes.ENUM("Facile", "Moyen", "Dur"),
                allowNull: false,
            },
            consumed: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            id_resume_journey: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            note: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
            },
            next_day_goal: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
            },
            actual_day_goal_completed: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("journal");
    },
};
