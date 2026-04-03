import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SOLANA_PRIVATE_KEY: z.string(),
    SOLANA_NETWORK: z.enum(["solana-devnet", "solana"]).default("solana"),
    SOLANA_RPC_URL: z.string().optional(),
    URL: z.string().url().default("http://localhost:3000"),
    
    // AI Provider Configuration
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    AI_GATEWAY_TOKEN: z.string().optional(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: {
    SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY,
    SOLANA_NETWORK: process.env.SOLANA_NETWORK,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    URL: process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    
    // AI Provider Configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    AI_GATEWAY_TOKEN: process.env.AI_GATEWAY_TOKEN,
  },

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});
