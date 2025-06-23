export interface JournalAttributes {
    id_journal: number;
    id_user: number;
    difficulty: "Facile" | "Moyen" | "Dur";
    consumed?: boolean;
    id_resume_journey?: number;
    note?: string;
    next_day_goal?: string;
    actual_day_goal_completed?: boolean;
    created_at: Date;
}

export interface ResumeJourneyAttributes {
    id_resume_journey: number;
    resume_journey: string;
}

export interface ActivitiesAttributes {
    id_activity: number;
    activity: string;
}

export interface UserActivityAttributes {
    id_activity_user: number;
    id_activity: number;
    id_journal: number;
    id_user: number;
}
