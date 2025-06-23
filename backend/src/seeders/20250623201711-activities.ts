import Activities from "../models/Activities";

const activitiesSeeds = [
    { activity: "Lecture" },
    { activity: "Repos" },
    { activity: "Marche" },
    { activity: "Méditation" },
    { activity: "Thérapie" },
    { activity: "Cuisine" },
    { activity: "Travail" },
    { activity: "Pleurs" },
    { activity: "Nettoyage" },
    { activity: "Passion" },
    { activity: "Sport" },
];

export const seedActivities = async () => {
    try {
        console.log("🌱 Seeding activities table...");

        const existingCount = await Activities.count();

        if (existingCount > 0) {
            console.log(
                "⚠️  Data already exists in activities table. Skipping seed."
            );
            return;
        }

        await Activities.bulkCreate(activitiesSeeds);

        console.log(
            `✅ Successfully seeded ${activitiesSeeds.length} activities entries`
        );
    } catch (error) {
        console.error("❌ Error seeding activities table:", error);
        throw error;
    }
};

export default seedActivities;
