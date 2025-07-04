import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("journal", {
            id_journal: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
            },
            id_user: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
            },
            difficulty: {
                type: DataTypes.ENUM("Facile", "Moyen", "Dur"),
                allowNull: false,
            },
            consumed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            id_resume_journey: {
                type: DataTypes.UUID,
                allowNull: true,
                defaultValue: DataTypes.UUIDV4,
            },
            note: {
                type: DataTypes.STRING,
                allowNull: true,
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
            have_points: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            created_at: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("journal");
    },
};
