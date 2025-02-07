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

// Test de connexion
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connexion à la base de données établie avec succès.");
    } catch (error) {
        console.error(
            "Impossible de se connecter à la base de données:",
            error
        );
    }
};

testConnection();

module.exports = sequelize;
