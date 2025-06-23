import ResumeJourney from "../models/ResumeJourney";

const resumeJourneySeeds = [
    { resume_journey: "Calme" },
    { resume_journey: "Joie" },
    { resume_journey: "Lutte" },
    { resume_journey: "Espoir" },
    { resume_journey: "Stress" },
    { resume_journey: "Progrès" },
    { resume_journey: "Fatigue" },
    { resume_journey: "Chute" },
    { resume_journey: "Force" },
    { resume_journey: "Solitude" },
];

export const seedResumeJourney = async () => {
    try {
        console.log("🌱 Seeding resume_journey table...");

        const existingCount = await ResumeJourney.count();

        if (existingCount > 0) {
            console.log(
                "⚠️  Data already exists in resume_journey table. Skipping seed."
            );
            return;
        }

        await ResumeJourney.bulkCreate(resumeJourneySeeds);

        console.log(
            `✅ Successfully seeded ${resumeJourneySeeds.length} resume_journey entries`
        );
    } catch (error) {
        console.error("❌ Error seeding resume_journey table:", error);
        throw error;
    }
};

export default seedResumeJourney;
