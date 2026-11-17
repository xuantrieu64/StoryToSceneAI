import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
});

export async function getPing(): Promise<unknown> {
  const response = await api.get('/ping');
  return response.data;
}
