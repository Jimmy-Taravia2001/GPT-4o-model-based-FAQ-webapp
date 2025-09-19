import axios from "axios";

// CRA proxy sends /api/* to Flask on 127.0.0.1:5000
const api = axios.create({
  withCredentials: true, // keep Flask session cookie
});

export const askQuestion = async (question) => {
  const { data } = await api.post("/api/ask", { question });
  return data;
};

export const getUsage = async () => {
  const { data } = await api.get("/api/usage");
  return data;
};

export const clearSession = async () => {
  const { data } = await api.post("/api/clear-session");
  return data;
};
