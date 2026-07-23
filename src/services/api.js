import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Use relative paths in local development to leverage Vite's proxy configuration (defined in vite.config.js)
// for routing /api requests to Java backend and /ai requests to Python AI backend.
// Default to http://localhost:8080 for Java Spring Boot backend
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login on 401 (Unauthorized). Do NOT redirect on 403 (Access Denied).
    if (error.response && error.response.status === 401) {
      const isLoginUrl = error.config && error.config.url && error.config.url.includes('/api/auth/login');
      if (!isLoginUrl) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('name');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


// Helper to get current user details from JWT and cache them
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const role = localStorage.getItem('role') || decoded.role || '';
    const email = decoded.sub || decoded.email || '';
    return { id: decoded.id || null, email, role, name: decoded.name || email.split('@')[0] };
  } catch (err) {
    console.error('Error decoding token', err);
    return null;
  }
};

// Asynchronous helper to fetch and cache user profile details from backend
export const refreshCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const email = decoded.sub || decoded.email || '';
    if (!email) return null;

    // Fetch all users to match email (standard way if there is no custom /me endpoint)
    const res = await api.get('/api/users');
    const matchedUser = res.data.find(u => u.email === email);
    if (matchedUser) {
      localStorage.setItem('currentUser', JSON.stringify(matchedUser));
      return matchedUser;
    }
  } catch (err) {
    console.error('Error refreshing current user', err);
  }
  return getCurrentUser();
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('currentUser');
};

export default api;
