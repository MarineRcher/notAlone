const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
    dialect: "postgres",
    host: process.env.POSTGRES_HOST || "db",
    username: process.env.POSTGRES_USER || "root",
    password: process.env.POSTGRES_PASSWORD || "root",
    database: process.env.POSTGRES_DB || "notalone",
    port: process.env.POSTGRES_PORT || 5432,
    logging: console.log,
    define: {
        timestamps: true,
        underscored: true,
    },
});

module.exports = sequelize;