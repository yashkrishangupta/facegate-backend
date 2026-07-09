// Single source of truth for the backend URL. Falls back to localhost for
// local dev if NEXT_PUBLIC_API_URL isn't set.
const RAW_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ORIGIN = RAW_ORIGIN.replace(/\/+$/, "");

export const API_URL = ORIGIN.endsWith("/api/v1")
  ? ORIGIN
  : `${ORIGIN}/api/v1`;
