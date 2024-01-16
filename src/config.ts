import { config } from "dotenv";

// Load dotenv config
config();

function throwRequiredEnvVar(name: string): never {
  throw new Error(`${name} is required.`);
}

export const CONFIG = {
  OPENAI_API_KEY:
    process.env.OPENAI_API_KEY || throwRequiredEnvVar("OPENAI_API_KEY"),
  HEADLESS: process.env.HEADLESS === "true",
  VERBOSE: process.env.VERBOSE === "true",
  CREDENTIALS: {
    USERNAME: process.env.ESPN_EMAIL || null,
    PASSWORD: process.env.ESPN_PASSWORD || null,
  },
  ESPN_MATCHES_URL:
    process.env.ESPN_MATCHES_URL ||
    "https://fantasy.espn.com/games/nfl-pigskin-pickem-2023/make-picks",
};
