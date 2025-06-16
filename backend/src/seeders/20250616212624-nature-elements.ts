import { QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
    const basePath = "notAlone/frontend/assets/forest";
    const now = new Date();

    // Génération des arbres
    const trees = [];
    for (let i = 1; i <= 8; i++) {
        trees.push({
            type: "tree",
            url: `${basePath}/trees/${i}.svg`,
            createdAt: now,
            updatedAt: now,
        });
    }

    // Génération des fleurs
    const flowers = [];
    const flowerNumbers = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ];

    for (const num of flowerNumbers) {
        flowers.push({
            type: "flower",
            url: `${basePath}/flowers/${num}.svg`,
            createdAt: now,
            updatedAt: now,
        });
    }

    // Insertion en base
    await queryInterface.bulkInsert("nature", [...trees, ...flowers]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete("nature", {}, {});
};
