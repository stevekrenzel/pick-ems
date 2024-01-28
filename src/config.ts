import { config } from "dotenv";

// Load dotenv config
config();

function throwRequiredEnvVar(name: string): never {
  throw new Error(`${name} is required.`);
}

export const CONFIG = {
  OPENAI_API_KEY:
    process.env.OPENAI_API_KEY || throwRequiredEnvVar("OPENAI_API_KEY"),
  OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
  HEADLESS: process.env.HEADLESS === "true",
  VERBOSE: process.env.VERBOSE === "true",
};

// Fail loudly if the OPENAI_API_KEY is still the default value
if (
  CONFIG.OPENAI_API_KEY ===
  "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
) {
  throw new Error(
    "Please set the OPENAI_API_KEY in your .env file to a non-default value."
  );
}

// Fail loudly if the OPENAI_ORG_ID is still the default value
if (CONFIG.OPENAI_ORG_ID === "org-xxxxxxxxxxxxxxxxxxxxxxxx") {
  throw new Error(
    "Please set the OPENAI_API_KEY in your .env file to a non-default value."
  );
}
