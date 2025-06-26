// 20231010101010-create-users-table.ts
import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.sequelize.query(
            "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""
        );

        await queryInterface.createTable("users", {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
            },
            login: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            has_premium: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            has2_f_a: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            two_factor_secret: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_blocked: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            notify: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            hour_notify: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            failed_login_attempts: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            blocked_until: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            points: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
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

        await queryInterface.addIndex("users", ["email"], { unique: true });
        await queryInterface.addIndex("users", ["login"], { unique: true });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("users");
    },
};
