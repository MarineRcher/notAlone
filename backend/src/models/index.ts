const User = require("./user.model");

async function initDatabase() {
    try {
        await User.sync();
        console.log("Tables créées avec succès !");
    } catch (error) {
        console.error("Erreur lors de la création des tables :", error);
    }
}

module.exports = initDatabase;
