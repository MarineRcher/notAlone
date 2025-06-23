import { QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
    const now = new Date("2025-06-15T19:01:16.561Z"); // Date fixe comme dans ton exemple

    const addictions = [
        {
            id: 1,
            addiction: "Tabac",
            phone_number: "3989",
            created_at: now,
            updated_at: now,
        },
        {
            id: 2,
            addiction: "Alcool",
            phone_number: "0969394020",
            created_at: now,
            updated_at: now,
        },
        {
            id: 3,
            addiction: "Jeux d'argent",
            phone_number: "0974751313",
            created_at: now,
            updated_at: now,
        },
    ];

    await queryInterface.bulkInsert("addictions", addictions);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete("addictions", {
        id: [1, 2, 3],
    });
};
