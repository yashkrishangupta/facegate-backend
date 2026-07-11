import dotenv from "dotenv";

dotenv.config();

// Falls back to a fixed dev secret so local setups don't crash without a
// .env — MUST be overridden via JWT_SECRET in any real deployment.
export const JWT_SECRET = process.env.JWT_SECRET || "facegate-dev-secret-change-me";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";