import { NextRequest, NextResponse } from "next/server";
import { getOrCreatePurchaserAccount, getSolanaNetwork } from "@/lib/solana-accounts";
import { getPolicy, getDailySpend } from "@/lib/ows-policy";

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    jsonrpc: "2.0",
    result: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: {
        name: "oilshock-arbitrageur-mcp",
        version: "1.0.0",
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          tools: [
            {
              name: "fetch_nexwave_signals",
              description:
                "Describes the Nexwave x402 signal endpoint. Returns payment requirements and data schema for the energy perp signal feed (WTI, Brent Crude, Natural Gas). The live agent pays $0.001 USDC on Solana mainnet per call via wrapFetchWithPayment.",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "get_agent_policy",
              description:
                "Returns the OWS spending policy governing this agent. Defines allowed chains, daily USDC spending cap ($2.00), and the deny action on violations.",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "get_agent_status",
              description:
                "Returns the agent's Solana wallet address, network, USDC asset, current daily spend, and remaining budget — sourced live from the OWS policy engine.",
              inputSchema: { type: "object", properties: {} },
            },
          ],
        },
      });
    }

    if (body.method === "tools/call") {
      const { name } = body.params;
      let result;

      switch (name) {
        case "fetch_nexwave_signals":
          result = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    endpoint: "https://nexwave.so/api/signals",
                    method: "GET",
                    description:
                      "Perp market signals — energy (Brent Crude, WTI, Natural Gas) + crypto top 50. Mark price, 24h change, volume, open interest, and funding rates. Refreshes every 15 seconds.",
                    x402_payment: {
                      scheme: "exact",
                      network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
                      amount: "1000",
                      asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                      payTo: "7RPNsA1PotVJhaAnKcBoydNgbx7YsN9kH8VBJa2g8EW9",
                      maxTimeoutSeconds: 300,
                    },
                    facilitator: "https://facilitator.payai.network",
                    cost_usd: "$0.001 per call",
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;

        case "get_agent_policy": {
          const policy = getPolicy();
          result = {
            content: [
              {
                type: "text",
                text: JSON.stringify(policy, null, 2),
              },
            ],
          };
          break;
        }

        case "get_agent_status": {
          const account = await getOrCreatePurchaserAccount();
          const network = getSolanaNetwork();
          const policy = getPolicy();
          const spent = getDailySpend();
          result = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    wallet_public_key: account.publicKey.toString(),
                    network,
                    usdc_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                    daily_spent_usdc: spent.toFixed(4),
                    daily_limit_usdc: policy.rules.spending_limit_usdc.toFixed(2),
                    remaining_usdc: (policy.rules.spending_limit_usdc - spent).toFixed(4),
                    signals_purchased: Math.round(spent / 0.001),
                    policy_id: policy.id,
                    note: "Fund wallet with mainnet USDC. Each signal fetch costs 1000 base units ($0.001).",
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        default:
          return NextResponse.json({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32601, message: "Method not found" },
          });
      }

      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result,
      });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.id,
      error: { code: -32601, message: "Method not found" },
    });
  } catch {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: "Internal error" },
    });
  }
}
