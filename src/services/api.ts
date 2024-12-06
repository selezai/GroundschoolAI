import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://groundschool-ai.onrender.com/api'
  : 'http://localhost:8080/api';

// Auth API
export const auth = {
  register: async (userData: { email: string; password: string; name: string }) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Topics API
export const topics = {
  getAll: async () => {
    const response = await axios.get(`${API_URL}/topics`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/topics/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  create: async (topicData: any) => {
    const response = await axios.post(`${API_URL}/topics`, topicData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  update: async (id: string, topicData: any) => {
    const response = await axios.put(`${API_URL}/topics/${id}`, topicData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/topics/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

// AI API
export const ai = {
  generateResponse: async (prompt: string) => {
    const response = await axios.post(`${API_URL}/ai/generate`, { prompt }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};
