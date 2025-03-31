
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://api:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les réponses et les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gestion globale des erreurs
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;