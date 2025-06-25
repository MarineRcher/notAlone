import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("user_activity", {
            id_activity_user: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            id_user: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            id_journal: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "journal",
                    key: "id_journal",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            id_activity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "activities",
                    key: "id_activity",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
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
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("user_activity");
    },
};
