export type Journal = {
    id_journal: number;
    difficulty?: string;
    [key: string]: any;
};

export type JournalResponse = {
    data: {
        journal?: Journal;
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
        };
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
