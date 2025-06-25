import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

const journalService = {
    getJournal: async (data: { date: Date }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/getJournal", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },
    getActivities: async () => {
        const response = await apiClient.get("/journal/getActivities");
        return response;
    },
    getResumeJourney: async () => {
        const response = await apiClient.get("/journal/getResumeJourney");
        return response;
    },
    addUserDifficulty: async (data: {
        id_journal?: number;
        date: Date;
        difficulty: string;
    }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addDifficulty", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },

    addUserConsumed: async (data: {
        id_journal: number;
        consumed: boolean;
    }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addConsumed", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },

    addActivities: async (data: { id_journal: number; activities: any[] }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addActivities", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },
    addPoints: async (data: { id_journal: number }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addPoints", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },

    addResumeJourney: async (data: {
        id_journal: number;
        id_resume_journey: number;
    }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post(
            "/journal/addResumeJourney",
            data,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response;
    },

    addGoal: async (data: { id_journal: number; next_day_goal: string }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addGoal", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },

    addNotes: async (data: { id_journal: number; note: string }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addNote", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },
    addCheckedGoal: async (data: {
        id_journal: number;
        actual_day_goal_completed: boolean;
    }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addCheckedGoal", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },
};

export default journalService;
