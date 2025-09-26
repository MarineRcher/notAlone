import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

export interface BadgeItem {
	badge_id: string;
	name: string;
	time_in_days: number;
	url: string;
}

export const badgeService = {
	getUserBadges: async (addictionId: number): Promise<BadgeItem[]> => {
		const token = await authHelpers.getToken();
		if (!token) {
			throw new Error("Token non disponible");
		}
		const response = await apiClient.post(
			"/badges/userBadges",
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

		return response.data;
	},
};
