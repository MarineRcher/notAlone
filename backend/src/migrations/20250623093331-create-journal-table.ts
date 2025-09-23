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
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
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
                references: {
                    model: "resume_journey",
                    key: "id_resume_journey",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
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

        // Add indexes for performance
        await queryInterface.addIndex("journal", ["id_user"]);
        await queryInterface.addIndex("journal", ["id_resume_journey"]);
        await queryInterface.addIndex("journal", ["created_at"]);
        await queryInterface.addIndex("journal", ["id_user", "created_at"]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("journal");
    },
};
