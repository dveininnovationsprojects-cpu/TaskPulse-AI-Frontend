import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

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

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && (user.id || user.id === 0)) {
        return user;
      }
    } catch (e) {
      // ignore invalid json
    }
  }

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const role = localStorage.getItem('role') || decoded.role || '';
    const email = localStorage.getItem('email') || decoded.sub || decoded.email || '';
    const name = localStorage.getItem('name') || decoded.name || (email ? email.split('@')[0] : '');
    const storedUserId = localStorage.getItem('userId');
    const id = storedUserId ? parseInt(storedUserId, 10) : (decoded.id || null);

    const userObj = { id, email, role, name };
    if (id) {
      localStorage.setItem('currentUser', JSON.stringify(userObj));
    }
    return userObj;
  } catch (err) {
    console.error('Error decoding token', err);
    return null;
  }
};

export const refreshCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const storedUserId = localStorage.getItem('userId');

  try {
    const decoded = jwtDecode(token);
    const email = decoded.sub || decoded.email || '';
    if (!email) return null;

    // Fetch all users to match email (standard way if there is no custom /me endpoint)
    const res = await api.get('/api/users');
    const users = res.data || [];

    let decodedEmail = '';
    if (token) {
      try {
        const decoded = jwtDecode(token);
        decodedEmail = decoded.sub || decoded.email || '';
      } catch (e) {}
    }
    const storedEmail = localStorage.getItem('email') || decodedEmail;

    const matchedUser = users.find(u => 
      (storedUserId && u.id && u.id.toString() === storedUserId.toString()) ||
      (storedEmail && u.email && u.email.toLowerCase() === storedEmail.toLowerCase())
    );

    if (matchedUser) {
      localStorage.setItem('currentUser', JSON.stringify(matchedUser));
      if (matchedUser.id) {
        localStorage.setItem('userId', matchedUser.id.toString());
      }
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
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  localStorage.removeItem('name');
  localStorage.removeItem('projectId');
  localStorage.removeItem('currentUser');
};

export default api;
