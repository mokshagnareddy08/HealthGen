import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase.auth.token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const suggestWorkouts = (profile: unknown, day: string) =>
  api.post('/fitness/suggest-workouts', { profile, day });

export const logWorkout = (payload: { profile_id?: string; activity_name: string; duration: number; calories_burnt: number; notes?: string }) =>
  api.post('/fitness/log-activity', payload);

export default api;
