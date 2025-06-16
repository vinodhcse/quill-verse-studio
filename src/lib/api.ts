import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'http://localhost:4000/api';

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include Authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Function to schedule token refresh
const scheduleTokenRefresh = () => {
  const token = localStorage.getItem('token');
  if (token) {
    const decodedToken = jwtDecode<{ exp: number }>(token);
    const expiresIn = decodedToken.exp * 1000 - Date.now();
    const refreshTime = expiresIn - 2 * 60 * 1000; // Refresh 2 minutes before expiration

    if (refreshTime > 0) {
      setTimeout(async () => {
        try {
          const refreshResponse = await apiClient.post('/auth/refreshToken');
          const newToken = refreshResponse.data.token;
          localStorage.setItem('token', newToken);
          scheduleTokenRefresh(); // Reschedule for the new token
        } catch (error) {
          console.error('Token refresh failed:', error);
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }, refreshTime);
    }
  }
};

// API functions
export const login = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.token);
  scheduleTokenRefresh();
  return response.data;
};

export const signup = async (name: string, email: string, password: string) => {
  const response = await apiClient.post('/auth/signup', { name, email, password });
  localStorage.setItem('token', response.data.token);
  scheduleTokenRefresh();
  return response.data;
};

export const createBook = async (title: string, authorName: string, createdAt: string) => {
  const response = await apiClient.post('/books', { title, authorName, createdAt });
  return response.data;
};

export const uploadBookImage = async (bookId: string, file: File, tags: string, description: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tags', tags);
  formData.append('description', description);

  const response = await apiClient.post(`/books/${bookId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateBookImage = async (bookId: string, bookImage: string) => {
  const response = await apiClient.patch(`/books/${bookId}`, { bookImage });
  return response.data;
};

export const fetchChapters = async (bookId: string, versionId: string) => {
  const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/chapters`);
  return response.data;
};

export const fetchSelectedChapter = async (bookId: string, versionId: string, chapterId: string) => {
  const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}`);
  return response.data;
};

export { apiClient };
