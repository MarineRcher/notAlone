import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        const now = new Date();
        await queryInterface.createTable("resume_journey", {
            id_resume_journey: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            resume_journey: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
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

        await queryInterface.addIndex("resume_journey", ["resume_journey"]);
        await queryInterface.bulkInsert("activities", [
            { activity: "Lecture", created_at: now, updated_at: now },
            { activity: "Repos", created_at: now, updated_at: now },
            { activity: "Marche", created_at: now, updated_at: now },
            { activity: "Méditation", created_at: now, updated_at: now },
            { activity: "Thérapie", created_at: now, updated_at: now },
            { activity: "Cuisine", created_at: now, updated_at: now },
            { activity: "Travail", created_at: now, updated_at: now },
            { activity: "Pleurs", created_at: now, updated_at: now },
            { activity: "Nettoyage", created_at: now, updated_at: now },
            { activity: "Passion", created_at: now, updated_at: now },
            { activity: "Sport", created_at: now, updated_at: now },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("resume_journey");
    },
};
