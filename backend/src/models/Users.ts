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
        },
    },
    {
        tableName: "users",
    }
);

module.exports = user;
