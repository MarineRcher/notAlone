import { QueryInterface, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        const now = new Date();
        await queryInterface.createTable("resume_journey", {
            id_resume_journey: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
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
        await queryInterface.bulkInsert("resume_journey", [
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Calme",
                created_at: now,
                updated_at: now,
            },
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Joie",
                created_at: now,
                updated_at: now,
            },
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Lutte",
                created_at: now,
                updated_at: now,
            },
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Stress",
                created_at: now,
                updated_at: now,
            },
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Progrès",
                created_at: now,
                updated_at: now,
            },
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Fatigue",
                created_at: now,
                updated_at: now,
            },
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Chute",
                created_at: now,
                updated_at: now,
            },
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Force",
                created_at: now,
                updated_at: now,
            },
            {
                id_resume_journey: uuidv4(),
                resume_journey: "Solitude",
                created_at: now,
                updated_at: now,
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("resume_journey");
    },
};
