import axios from "axios";

export const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Ensure cookies (JWT) are sent/received by default
apiService.defaults.withCredentials = true;
