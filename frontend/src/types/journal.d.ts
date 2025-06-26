export type Journal = {
    id_journal: string;
    difficulty?: string;
    [key: string]: any;
};

export type JournalResponse = {
    data: {
        journal?: Journal;
        activities?: {
            user_activity: {
                id_activity: string;
                id_journal: string;
                [key: string]: any;
            };
            activity_details: Activity[];
        }[];
        [key: string]: any;
    };
};

export type ResumeJourneyWord = {
    id_resume_journey: string;
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
    journalId?: string;
    existingData?: {
        journal?: {
            id_journal: string;
            difficulty?: string;
            consumed?: boolean;
            resume?: string;
            [key: string]: any;
            next_day_goal?: string | null;
            actual_day_goal_completed?: boolean | null;
            note?: string | null;
        };
        activities?: {
            user_activity: {
                id_activity: string;
                id_journal: string;
                [key: string]: any;
            };
            activity_details: Activity[];
        }[];
        resume_journey?: ResumeJourneyWord | null;
        previous_day_goal?: string | null;
        [key: string]: any;
    };
    isNewJournal: boolean;
    currentStep: Step;
};

export type Activity = {
    id_activity: string;
    activity: string;
    createdAt: string;
    updatedAt: string;
};
