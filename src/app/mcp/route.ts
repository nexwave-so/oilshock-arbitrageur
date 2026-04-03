import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSellerAccount, getSolanaNetwork } from "@/lib/solana-accounts";

const sellerAccount = await getOrCreateSellerAccount();

// Simple MCP server implementation for Solana
export async function GET(request: NextRequest) {
  return NextResponse.json({
    jsonrpc: "2.0",
    result: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "test-mcp-solana",
        version: "0.0.1",
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
              name: "get_random_number",
              description: "Get a random number between two numbers",
              inputSchema: {
                type: "object",
                properties: {
                  min: { type: "integer" },
                  max: { type: "integer" },
                },
                required: ["min", "max"],
              },
            },
            {
              name: "add",
              description: "Add two numbers",
              inputSchema: {
                type: "object",
                properties: {
                  a: { type: "integer" },
                  b: { type: "integer" },
                },
                required: ["a", "b"],
              },
            },
            {
              name: "hello-remote",
              description: "Receive a greeting",
              inputSchema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
                required: ["name"],
              },
            },
            {
              name: "solana-account-info",
              description: "Get Solana account information",
              inputSchema: {
                type: "object",
                properties: {},
              },
            },
            {
              name: "test-x402-payment",
              description: "Test x402 payment functionality with Solana",
              inputSchema: {
                type: "object",
                properties: {
                  amount: { type: "number", description: "Payment amount in USDC" },
                },
                required: ["amount"],
              },
            },
          ],
        },
      });
    }
    
    if (body.method === "tools/call") {
      const { name, arguments: args } = body.params;
      
      let result;
      switch (name) {
        case "get_random_number":
          const randomNumber = Math.floor(Math.random() * (args.max - args.min + 1)) + args.min;
          result = { content: [{ type: "text", text: `Random number: ${randomNumber}` }] };
          break;
          
        case "add":
          const sum = args.a + args.b;
          result = { content: [{ type: "text", text: `Result: ${sum}` }] };
          break;
          
        case "hello-remote":
          result = { content: [{ type: "text", text: `Hello ${args.name}` }] };
          break;
          
        case "solana-account-info":
          result = {
            content: [
              {
                type: "text",
                text: `Solana Account: ${sellerAccount.publicKey.toString()}\nNetwork: ${getSolanaNetwork()}`,
              },
            ],
          };
          break;
          
        case "test-x402-payment":
          try {
            const { createSolanaSigner } = await import("@/lib/solana-accounts");
            const signer = await createSolanaSigner();
            result = {
              content: [
                {
                  type: "text",
                  text: `✅ x402 Solana integration working!\nPayment amount: $${args.amount} USDC\nSigner created successfully\nNetwork: ${getSolanaNetwork()}\nReady for payments!`,
                },
              ],
            };
          } catch (error) {
            result = {
              content: [
                {
                  type: "text",
                  text: `❌ x402 Solana integration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
            };
          }
          break;
          
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
  } catch (error) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: "Internal error" },
    });
  }
}
