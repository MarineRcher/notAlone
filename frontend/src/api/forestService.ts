import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

const forestService = {
    getForest: async () => {
        const response = await apiClient.get("/forest/getForest");
        return response.data;
    },
    addElement: async (data: {
        x: number;
        y: number;
        id_nature: number;
        side: string;
    }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/forest/addElement", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};

export default forestService;
