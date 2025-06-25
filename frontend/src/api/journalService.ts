import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

const journalService = {
	getJournal: async (data: { date: Date }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/journal/getJournal", data, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},
	getActivities: async () =>
	{
		const response = await apiClient.get("/journal/getActivities");

		return response;
	},
	getResumeJourney: async () =>
	{
		const response = await apiClient.get("/journal/getResumeJourney");

		return response;
	},
	addUserDifficulty: async (data: {
        id_journal?: string;
        date: Date;
        difficulty: string;
    }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/journal/addDifficulty", data, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},

	addUserConsumed: async (data: {
        id_journal: string;
        consumed: boolean;
    }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/journal/addConsumed", data, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},

	addActivities: async (data: { id_journal: string; activities: any[] }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/journal/addActivities", data, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},
	addPoints: async (data: { id_journal: string }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/journal/addPoints", data, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},

	addResumeJourney: async (data: {
        id_journal: string;
        id_resume_journey: string;
    }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post(
			"/journal/addResumeJourney",
			data,
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);

		return response;
	},

	addGoal: async (data: { id_journal: string; next_day_goal: string }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/journal/addGoal", data, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},

	addNotes: async (data: { id_journal: string; note: string }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/journal/addNote", data, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},
	addCheckedGoal: async (data: {
        id_journal: string;
        actual_day_goal_completed: boolean;
    }) =>
	{
		const token = await authHelpers.getToken();

		if (!token)
		{
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/journal/addCheckedGoal", data, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},
};

export default journalService;
