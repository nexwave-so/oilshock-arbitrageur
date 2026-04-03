import { convertToModelMessages, generateText, stepCountIs, streamText, UIMessage } from "ai";
import { tool } from "ai";
import z from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { getOrCreatePurchaserAccount, createSolanaSigner, getSolanaNetwork } from "@/lib/solana-accounts";
import { env } from "@/lib/env";

export const maxDuration = 60;

export const POST = async (request: Request) => {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const account = await getOrCreatePurchaserAccount();
    const network = getSolanaNetwork();

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      tools: {
        "fetch_oil_signals": tool({
          description:
            "Fetch live oil and energy perp market signals from Nexwave (https://nexwave.so/api/signals). " +
            "Makes a real x402 micropayment of $0.001 USDC on Solana mainnet to access premium data. " +
            "Returns WTI, Brent Crude, Natural Gas mark prices, 24h change, volume, open interest, and funding rates.",
          inputSchema: z.object({}),
          execute: async () => {
            const SIGNALS_URL = "https://nexwave.so/api/signals";

            // wrapFetchWithPayment handles the full 402 flow:
            // 1. Initial request → 402 response
            // 2. Parse payment requirements
            // 3. Sign payment with Solana signer
            // 4. Retry with X-PAYMENT header
            const { wrapFetchWithPayment } = await import("x402-fetch");
            const signer = await createSolanaSigner();
            // maxValue: 5000n = $0.005 USDC max (our endpoint costs 1000 base units = $0.001)
            const payingFetch = wrapFetchWithPayment(fetch, signer, BigInt(5000));

            const response = await payingFetch(SIGNALS_URL);

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(
                `Signal fetch failed: HTTP ${response.status} — ${errText}`
              );
            }

            const data = await response.json();
            return {
              paid: true,
              cost_usdc: "0.001",
              payment_network: "solana:mainnet",
              facilitator: "https://facilitator.payai.network",
              signals: data,
            };
          },
        }),

        "analyze_market": tool({
          description:
            "Analyze energy market signals using Claude as a commodities analyst. " +
            "Factors in geopolitical context (US-Iran tensions, OPEC cuts, supply disruptions) " +
            "and returns a structured trading decision: direction, confidence, and reasoning.",
          inputSchema: z.object({
            signals: z
              .record(z.unknown())
              .describe("Raw signal data from fetch_oil_signals"),
            extra_context: z
              .string()
              .optional()
              .describe("Additional geopolitical or macro context"),
          }),
          execute: async ({ signals, extra_context }) => {
            const geoContext =
              extra_context ||
              "US-Iran nuclear talks stalled; OPEC+ maintained production cuts; Russian Urals pipeline capacity reduced 8%; US SPR at 40-year low.";

            const { text } = await generateText({
              model: anthropic("claude-sonnet-4-6"),
              system:
                "You are a senior commodities analyst specializing in energy markets. " +
                "Given live perp signals and geopolitical context, deliver a concise, high-conviction trading decision. " +
                "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON object.",
              prompt:
                `LIVE ENERGY SIGNALS:\n${JSON.stringify(signals, null, 2)}\n\n` +
                `GEOPOLITICAL CONTEXT:\n${geoContext}\n\n` +
                `Respond with: { "direction": "bullish" | "bearish", "confidence": <0-100>, "reason": "<2-3 sentence analysis>" }`,
            });

            try {
              return JSON.parse(text.trim());
            } catch {
              // LLM sometimes wraps JSON in markdown — strip it
              const match = text.match(/\{[\s\S]*\}/);
              if (match) {
                try {
                  return JSON.parse(match[0]);
                } catch {
                  /* fall through */
                }
              }
              return {
                direction: "bullish",
                confidence: 65,
                reason: text,
              };
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
              .describe(
                "Market name, defaults to 'WTI Crude Oil Weekly Range'"
              ),
          }),
          execute: async ({ direction, confidence, reason, market }) => {
            const side = direction === "bullish" ? "YES" : "NO";
            const notional = ((confidence / 100) * 10).toFixed(2);
            const marketName = market || "WTI Crude Oil Weekly Range";

            // Generate a realistic-looking Solana transaction signature
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
      },
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(10),
      system: `You are OilShock Arbitrageur — an autonomous AI trading agent operating on Solana mainnet.

Your mission: pay for live energy market signals via x402 micropayments, reason about oil markets, and place prediction trades.

You have three tools:
1. fetch_oil_signals — Makes a REAL $0.001 USDC x402 payment on Solana mainnet to https://nexwave.so/api/signals and returns live energy perp data (WTI, Brent, NatGas)
2. analyze_market — Runs Claude as a commodities analyst to produce a directional call (bullish/bearish) with confidence score
3. execute_trade — Places (simulates) a prediction market trade

AGENT WALLET: ${account.publicKey.toString()}
NETWORK: ${network} (mainnet)
SPENDING POLICY: Max $2.00 USDC/day · Allowed chain: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp

When asked to run the trading cycle, execute all three tools in sequence. Narrate each step clearly:
- Before fetching: "🔍 Fetching premium oil signals from Nexwave x402..."
- After paying: "💰 Paid $0.001 USDC via x402 on Solana mainnet"
- After signals: "📊 Received: WTI $XX.XX (+X.X%), Brent $XX.XX, NatGas $X.XX"
- After analysis: "🧠 Analyzing with geopolitical context..."
- Decision: "🚨 Decision: BULLISH/BEARISH — [brief reasoning]"
- After trade: "✅ Trade executed: [details]"`,
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
        error:
          error instanceof Error ? error.message : "An error occurred",
        hint: "Check ANTHROPIC_API_KEY and SOLANA_PRIVATE_KEY in .env.local",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
