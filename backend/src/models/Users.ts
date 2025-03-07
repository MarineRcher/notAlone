const { DataTypes } = require("sequelize");
const db = require("../config/database");

const user = db.define(
    "User",
    {
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
            validate: {
                isEmail: true,
            },
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
    },
    {
        tableName: "users",
        timestamps: true,
    }
);

module.exports = user;
