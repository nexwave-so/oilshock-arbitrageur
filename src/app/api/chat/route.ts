import { convertToModelMessages, generateText, stepCountIs, streamText, UIMessage } from "ai";
import { tool } from "ai";
import z from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { getOrCreatePurchaserAccount, createSolanaSigner, getSolanaNetwork } from "@/lib/solana-accounts";
import { policyCheck, getDailySpend, getPolicy } from "@/lib/ows-policy";
import { env } from "@/lib/env";

// Configure OpenRouter
const openrouter = createOpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const maxDuration = 60;

const SIGNAL_CHAIN = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
const SIGNAL_COST_USDC = 0.001;

export const POST = async (request: Request) => {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const account = await getOrCreatePurchaserAccount();
    const network = getSolanaNetwork();

    const result = streamText({
      model: openrouter("anthropic/claude-3.7-sonnet"),
      tools: {
        "fetch_oil_signals": tool({
          description:
            "Fetch live oil and energy perp market signals from Nexwave (https://nexwave.so/api/signals). " +
            "First checks the OWS policy engine — if the $2.00/day spending cap would be exceeded the call is blocked. " +
            "If approved, makes a real x402 micropayment of $0.001 USDC on Solana mainnet and returns " +
            "WTI, Brent Crude, Natural Gas mark prices, 24h change, volume, open interest, and funding rates.",
          inputSchema: z.object({}),
          execute: async () => {
            // ── OWS Policy Engine intercept ─────────────────────────────────
            // Every signing request is evaluated against policy BEFORE payment.
            const check = policyCheck(SIGNAL_COST_USDC, SIGNAL_CHAIN);
            if (!check.allowed) {
              throw new Error(`🚫 OWS Policy Engine blocked: ${check.reason}`);
            }
            // ───────────────────────────────────────────────────────────────

            const SIGNALS_URL = "https://nexwave.so/api/signals";

            // wrapFetchWithPayment handles the full 402 flow:
            // 1. Initial request → 402 response
            // 2. Parse payment requirements from 402 body
            // 3. Sign payment with Solana signer
            // 4. Retry with X-PAYMENT header
            const { wrapFetchWithPayment } = await import("x402-fetch");
            const signer = await createSolanaSigner();
            // maxValue: 5000 = $0.005 USDC max guard (endpoint costs 1000 base units = $0.001)
            const payingFetch = wrapFetchWithPayment(fetch, signer, BigInt(5000));

            const response = await payingFetch(SIGNALS_URL);

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Signal fetch failed: HTTP ${response.status} — ${errText}`);
            }

            const data = await response.json();
            return {
              paid: true,
              cost_usdc: SIGNAL_COST_USDC.toString(),
              payment_network: "solana:mainnet",
              facilitator: "https://facilitator.payai.network",
              daily_spent_usdc: getDailySpend().toFixed(4),
              signals: data,
            };
          },
        }),

        "analyze_market": tool({
          description:
            "Analyze energy market signals and prediction market data using Claude as a commodities analyst. " +
            "Factors in geopolitical context (US-Iran tensions, OPEC cuts, supply disruptions) " +
            "and returns a structured trading decision: direction, confidence, and reasoning.",
          inputSchema: z.object({
            signals: z
              .record(z.unknown())
              .describe("Raw signal data from fetch_oil_signals"),
            market_context: z
              .string()
              .optional()
              .describe("Prediction market data or additional context from get_prediction_market"),
            extra_context: z
              .string()
              .optional()
              .describe("Additional geopolitical or macro context"),
          }),
          execute: async ({ signals, market_context, extra_context }) => {
            const geoContext =
              extra_context ||
              "US-Iran nuclear talks stalled; OPEC+ maintained production cuts; Russian Urals pipeline capacity reduced 8%; US SPR at 40-year low.";

            const marketContext = market_context
              ? `\n\nPREDICTION MARKET DATA:\n${market_context}`
              : "";

            const { text } = await generateText({
              model: openrouter("anthropic/claude-3.7-sonnet"),
              system:
                "You are a senior commodities analyst specializing in energy markets. " +
                "Given live perp signals, prediction market odds, and geopolitical context, " +
                "deliver a concise, high-conviction trading decision. " +
                "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON object.",
              prompt:
                `LIVE ENERGY SIGNALS:\n${JSON.stringify(signals, null, 2)}\n\n` +
                `GEOPOLITICAL CONTEXT:\n${geoContext}${marketContext}\n\n` +
                `Respond with: { "direction": "bullish" | "bearish", "confidence": <0-100>, "reason": "<2-3 sentence analysis>" }`,
            });

            try {
              return JSON.parse(text.trim());
            } catch {
              const match = text.match(/\{[\s\S]*\}/);
              if (match) {
                try {
                  return JSON.parse(match[0]);
                } catch {
                  /* fall through */
                }
              }
              return { direction: "bullish", confidence: 65, reason: text };
            }
          },
        }),

        "execute_trade": tool({
          description:
            "Execute a prediction market trade based on the market analysis. " +
            "Supports DFlow and Kalshi-style markets. " +
            "For the hackathon MVP this is simulated but shows realistic trade details and a Solscan explorer link.",
          inputSchema: z.object({
            direction: z
              .enum(["bullish", "bearish"])
              .describe("Trading direction from analyze_market"),
            confidence: z
              .number()
              .min(0)
              .max(100)
              .describe("Confidence score 0-100"),
            reason: z.string().describe("Analysis reasoning"),
            market: z
              .string()
              .optional()
              .describe("Market name — use one from get_prediction_market if available"),
          }),
          execute: async ({ direction, confidence, reason, market }) => {
            const side = direction === "bullish" ? "YES" : "NO";
            const notional = ((confidence / 100) * 10).toFixed(2);
            const marketName = market || "WTI Crude Oil Weekly Range";

            const fakeSig = Array.from({ length: 87 }, () =>
              "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"[
                Math.floor(Math.random() * 58)
              ]
            ).join("");

            return {
              status: "executed",
              market: marketName,
              side,
              notional_usdc: notional,
              confidence_pct: confidence,
              reason,
              agent_wallet: account.publicKey.toString(),
              explorer_url: `https://solscan.io/tx/${fakeSig}`,
              timestamp: new Date().toISOString(),
              simulated: true,
              note: "Simulated — DFlow/Kalshi execution pending live integration",
            };
          },
        }),

        "get_prediction_market": tool({
          description:
            "Fetch a real prediction market from Kalshi via DFlow. " +
            "Returns current odds, title, and market details for oil and energy events. " +
            "Use this BEFORE analyze_market to pass market context into the analysis.",
          inputSchema: z.object({
            query: z
              .string()
              .optional()
              .describe("Market search query — defaults to 'oil crude'"),
          }),
          execute: async ({ query }) => {
            const searchQuery = query || "oil crude";

            // Try DFlow public API
            try {
              const resp = await fetch(
                `https://pond.dflow.net/api/v1/markets?query=${encodeURIComponent(searchQuery)}&limit=3`,
                { signal: AbortSignal.timeout(5000) }
              );
              if (resp.ok) {
                const data = await resp.json();
                return { source: "dflow", markets: data };
              }
            } catch {
              // DFlow not reachable — fall through to mock
            }

            // Fallback: realistic mock based on actual Kalshi oil markets
            return {
              source: "mock (DFlow unavailable in this environment)",
              markets: [
                {
                  id: "kxwtiw-26apr03",
                  title: "WTI Crude Oil: Will it close above $80 this week?",
                  yes_price: 0.42,
                  no_price: 0.58,
                  volume_24h: 18400,
                  expiry: "2026-04-04T20:00:00Z",
                  exchange: "Kalshi (via DFlow on Solana)",
                },
                {
                  id: "kxbrent-26apr03",
                  title: "Brent Crude: Will it exceed $84 before Friday?",
                  yes_price: 0.31,
                  no_price: 0.69,
                  volume_24h: 9200,
                  expiry: "2026-04-04T20:00:00Z",
                  exchange: "Kalshi (via DFlow on Solana)",
                },
              ],
            };
          },
        }),

        "get_spending_status": tool({
          description:
            "Check the agent's current daily spending against the OWS policy limit. " +
            "Call this to show how much budget remains before the $2.00/day cap is hit.",
          inputSchema: z.object({}),
          execute: async () => {
            const policy = getPolicy();
            const spent = getDailySpend();
            const remaining = policy.rules.spending_limit_usdc - spent;
            return {
              daily_spent_usdc: spent.toFixed(4),
              daily_limit_usdc: policy.rules.spending_limit_usdc.toFixed(2),
              remaining_usdc: remaining.toFixed(4),
              signals_purchased: Math.round(spent / SIGNAL_COST_USDC),
              allowed_chains: policy.rules.allowed_chains,
              policy_id: policy.id,
              policy_action: policy.action,
            };
          },
        }),
      },
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(15),
      system: `You are OilShock Arbitrageur — an autonomous AI trading agent operating on Solana mainnet.

Your mission: pay for live energy market signals via x402 micropayments, reason about oil markets using prediction market data and geopolitical context, and place trades — all governed by an OWS spending policy.

You have five tools:
1. get_prediction_market — Fetches real Kalshi prediction market data for oil/energy events (current odds, volume, expiry)
2. fetch_oil_signals — Checks the OWS Policy Engine first, then pays $0.001 USDC via x402 on Solana mainnet to get live WTI/Brent/NatGas perp data
3. analyze_market — Runs Claude as a commodities analyst, incorporating both signals AND prediction market context
4. execute_trade — Places (simulates) a prediction market trade with a Solscan explorer link
5. get_spending_status — Reports current daily spend vs. the $2.00/day OWS policy cap

AGENT WALLET: ${account.publicKey.toString()}
NETWORK: ${network} (mainnet)
OWS POLICY: Max $2.00 USDC/day · Chain: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp · Action: deny

FULL TRADING CYCLE (when asked to run the full cycle):
1. get_prediction_market → get current Kalshi odds for oil
2. fetch_oil_signals → pay via x402, get live perp data (OWS policy intercepts here)
3. analyze_market → pass both signals + market context for a combined analysis
4. execute_trade → place the trade using the Kalshi market from step 1

Narrate each step clearly:
- "📈 Checking Kalshi prediction markets..."
- "🔍 Fetching premium oil signals from Nexwave x402..."
- "🛡️ OWS Policy Engine approved — $X.XXX of $2.00 daily budget used"
- "💰 Paid $0.001 USDC via x402 on Solana mainnet"
- "📊 Received: WTI $XX.XX (+X.X%), Brent $XX.XX, NatGas $X.XX"
- "🧠 Analyzing with prediction market odds + geopolitical context..."
- "🚨 Decision: BULLISH/BEARISH — [brief reasoning]"
- "✅ Trade executed: [details]"`,
    });

    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      messageMetadata: () => ({ network }),
    });
  } catch (error) {
    console.error("OilShock chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
        hint: "Check OPENROUTER_API_KEY and SOLANA_PRIVATE_KEY in .env.local",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
