// 20231010101010-create-users-table.ts
import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("users", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
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
            hasPremium: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            has2FA: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            twoFactorSecret: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            isBlocked: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            notify: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            hourNotify: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            failedLoginAttempts: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            blockedUntil: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
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
