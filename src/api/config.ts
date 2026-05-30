const raw = import.meta.env.VITE_API_URL;

export const API_URL = (typeof raw === 'string' && raw.length > 0
  ? raw
  : 'http://localhost:8080'
).replace(/\/$/, '');
