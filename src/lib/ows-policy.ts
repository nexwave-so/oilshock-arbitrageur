/**
 * OWS-style Policy Engine (in-memory MVP)
 *
 * In production this would use the @open-wallet-standard/core SDK to intercept
 * every signing request and evaluate it against human-defined parameters BEFORE
 * decryption is permitted. This implementation mirrors that interface exactly —
 * the policyCheck() call site in fetch_oil_signals is identical to what a real
 * OWS integration would look like.
 */

const POLICY = {
  id: "oilshock-arbitrageur",
  name: "Restricted Agent Spending",
  version: 1,
  rules: {
    allowed_chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
    spending_limit_usdc: 2.0,
    spending_period: "daily",
  },
  action: "deny" as const,
};

let dailySpend = 0;
let lastResetDate = new Date().toDateString();

function maybeReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailySpend = 0;
    lastResetDate = today;
  }
}

export function policyCheck(
  amountUsdc: number,
  chain: string
): { allowed: boolean; reason?: string } {
  maybeReset();

  if (!POLICY.rules.allowed_chains.includes(chain)) {
    return {
      allowed: false,
      reason: `Chain ${chain} not in allowed_chains policy`,
    };
  }

  if (dailySpend + amountUsdc > POLICY.rules.spending_limit_usdc) {
    return {
      allowed: false,
      reason: `Would exceed daily limit: $${dailySpend.toFixed(3)} spent + $${amountUsdc.toFixed(3)} requested > $${POLICY.rules.spending_limit_usdc.toFixed(2)} cap`,
    };
  }

  // Approved — record the spend
  dailySpend += amountUsdc;
  return { allowed: true };
}

export function getDailySpend(): number {
  maybeReset();
  return dailySpend;
}

export function getPolicy() {
  return POLICY;
}
