const User = require("./Users");

async function createDb() {
    try {
        await User.sync();
        console.log("Tables créées avec succès !");
    } catch (error) {
        console.error("Erreur lors de la création des tables :", error);
    }
}

module.exports = createDb;
