import axios from 'axios';

// Central place for the API base URL, read from Vite's env (client/.env).
// Vite only exposes variables prefixed with VITE_ to the browser bundle.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT (if we have one) to every outgoing request automatically,
// so individual pages don't need to remember to do it themselves.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
