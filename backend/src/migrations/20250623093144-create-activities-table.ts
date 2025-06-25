import { QueryInterface, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        const now = new Date();
        await queryInterface.createTable("activities", {
            id_activity: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
            },
            activity: {
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

        await queryInterface.addIndex("activities", ["activity"]);
        await queryInterface.bulkInsert("activities", [
            {
                id_activity: uuidv4(),
                activity: "Lecture",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Repos",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Marche",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Méditation",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Thérapie",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Cuisine",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Travail",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Pleurs",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Nettoyage",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Passion",
                created_at: now,
                updated_at: now,
            },
            {
                id_activity: uuidv4(),
                activity: "Sport",
                created_at: now,
                updated_at: now,
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("activities");
    },
};
