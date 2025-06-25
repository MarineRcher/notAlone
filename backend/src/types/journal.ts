export interface JournalAttributes {
    id_journal: string;
    id_user: string;
    difficulty: "Facile" | "Moyen" | "Dur";
    consumed?: boolean;
    id_resume_journey?: string;
    note?: string;
    next_day_goal?: string;
    actual_day_goal_completed?: boolean;
    have_points?: boolean;
    created_at: Date;
}

export interface ResumeJourneyAttributes {
    id_resume_journey: string;
    resume_journey: string;
}

export interface ActivitiesAttributes {
    id_activity: string;
    activity: string;
}

export interface UserActivityAttributes {
    id_activity_user: string;
    id_activity: string;
    id_journal: string;
    id_user: string;
}
