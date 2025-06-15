import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

const addictionService = {
    getAllAddictions: async () => {
        const response = await apiClient.get("/addictions/all");
        return response.data;
    },
    getUserAddictions: async () => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post(
            "/addictions/getByUser",
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    },

    addUserAddiction: async (data: {
        addiction_id: number;
        date: string;
        use_a_day?: number;
        spending_a_day?: number;
    }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/addictions/addByUser", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};

export default addictionService;
