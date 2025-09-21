import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

export interface ForestItem {
	id_forest: string;
	id_nature: string;
	x: number;
	y: number;
	url: string | null;
}

export interface NatureItem {
	id_nature: string;
	x: number;
	y: number;
	points: number;
}
export interface TreeItem {
	id_nature: string;
	name: string;
	type: string;
	points: number;
	url: string | null;
}

export const gamesService = {
	getUserForest: async (): Promise<ForestItem[]> => {
		const response = await apiClient.get("/games/userForest");
		return response.data;
	},
	addNature: async (nature: NatureItem) => {
		const token = await authHelpers.getToken();

		if (!token) {
			throw new Error("Token non disponible");
		}
		const response = await apiClient.post("/games/addNature", nature, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data;
	},
	getTrees: async (): Promise<TreeItem[]> => {
		const response = await apiClient.get("/games/trees");
		return response.data;
	},
	getflowers: async (): Promise<TreeItem[]> => {
		const response = await apiClient.get("/games/flowers");
		return response.data;
	},
	getUserPoints: async (): Promise<{ points: number }> => {
		const token = await authHelpers.getToken();
		if (!token) {
			throw new Error("Token non disponible");
		}
		const response = await apiClient.get("/games/points", {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data;
	},
};
