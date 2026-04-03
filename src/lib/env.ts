import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SOLANA_PRIVATE_KEY: z.string(),
    SOLANA_NETWORK: z.enum(["solana-devnet", "solana"]).default("solana"),
    SOLANA_RPC_URL: z.string().optional(),
    ANTHROPIC_API_KEY: z.string(),
  },

  runtimeEnv: {
    SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY,
    SOLANA_NETWORK: process.env.SOLANA_NETWORK,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },

  emptyStringAsUndefined: true,
  // Set SKIP_ENV_VALIDATION=1 for CI/preview builds without secrets
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
