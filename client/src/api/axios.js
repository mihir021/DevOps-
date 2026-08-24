import axios from 'axios';

// Central place for the API base URL.
//
// We use a relative path ("/api") instead of a full URL like
// "http://<some-ip>:5000/api". This works because:
//   - In production: Nginx reverse-proxies /api/* → server:5000/api/*
//     (see client/nginx.conf), so the browser never needs to know
//     the backend's IP or port.
//   - In local dev:   Vite's dev-server proxy does the same thing
//     (see vite.config.js proxy setting).
//
// This eliminates hardcoded IPs and means the frontend never needs
// to be rebuilt when the server's public IP changes.
const api = axios.create({
  baseURL: '/api',
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

