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

    addUserConsumed: async (data: { id_journal: number; consumed: string }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addConsumed", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },

    // Ajoutez les autres méthodes selon vos endpoints
    addActivities: async (data: { id_journal: number; activities: any[] }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addActivities", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },

    addResumeJourney: async (data: {
        id_journal: number;
        resume_journey: string;
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

    addNotes: async (data: { id_journal: number; notes: string }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/journal/addNotes", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response;
    },
};

export default journalService;
