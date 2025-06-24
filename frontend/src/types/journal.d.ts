export type Journal = {
    id_journal: number;
    difficulty?: string;
    [key: string]: any;
};

export type JournalResponse = {
    data: {
        journal?: Journal;
        activities?: Activity[]; // Ajout pour les activités existantes
        [key: string]: any;
    };
};

export type ResumeJourneyWord = {
    id_resume_journey: number;
    resume_journey: string;
    createdAt: string;
    updatedAt: string;
};

export type Step =
    | "difficulty"
    | "consumed"
    | "resume"
    | "activities"
    | "goal"
    | "note";

export type NavigationParams = {
    date: string;
    journalId?: number;
    existingData?: {
        journal?: {
            id_journal: number;
            difficulty?: string;
            consumed?: boolean;
            resume?: string;
            [key: string]: any;
            next_day_goal?: string | null;
            actual_day_goal_completed?: boolean | null;
            note?: string | null;
        };
        activities?: Array<{
            user_activity: {
                id_activity: number;
                id_journal: number;
                [key: string]: any;
            };
            activity_details: Activity[];
        }>;
        resume_journey?: ResumeJourneyWord | null;
        previous_day_goal?: string | null;
        [key: string]: any;
    };
    isNewJournal: boolean;
    currentStep: Step;
};

export type Activity = {
    id_activity: number;
    activity: string;
    createdAt: string;
    updatedAt: string;
};
