import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

export interface Acquired {
	acquired_id: string;
	addiction_id: string;
	acquired: string;
	number: number;
	unity: string;
}

export interface AcquiredResponse {
	acquired: Acquired[];
	startDate: Date;
}

export const statsService = {
	getAcquired: async (addictionId: string): Promise<AcquiredResponse> => {
		const token = await authHelpers.getToken();
		if (!token) {
			throw new Error("Token non disponible");
		}
		const response = await apiClient.post(
			"/stats/acquired",
			{
				addiction_id: addictionId,
			},
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);

		return {
			acquired: response.data.acquired,
			startDate: new Date(response.data.startDate),
		};
	},
};
