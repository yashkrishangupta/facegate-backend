// Single source of truth for the backend URL. Falls back to localhost for
// local dev if NEXT_PUBLIC_API_URL isn't set.
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
export const API_URL = RAW_API_URL.replace(/\/+$/, "");
