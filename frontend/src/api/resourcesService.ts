import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

const resourcesService = {
	getUserAddictionLinks: async () => {
		const token = await authHelpers.getToken();

		if (!token) {
			throw new Error("Token non disponible");
		}

		const response = await apiClient.get("/resources/getUserAddictionLinks", {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},
	canAcceessAnimation: async () => {
		const token = await authHelpers.getToken();

		if (!token) {
			throw new Error("Token non disponible");
		}

		const response = await apiClient.get("/resources/canAcceessAnimation", {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},
	updateLastAnimation: async () => {
		const token = await authHelpers.getToken();

		if (!token) {
			throw new Error("Token non disponible");
		}

		const response = await apiClient.post("/resources/updateLastAnimation", {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response;
	},
};

export default resourcesService;
