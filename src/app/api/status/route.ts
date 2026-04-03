import { getDailySpend, getPolicy } from "@/lib/ows-policy";
import { getOrCreatePurchaserAccount, getSolanaNetwork } from "@/lib/solana-accounts";
import { NextResponse } from "next/server";

export async function GET() {
  const account = await getOrCreatePurchaserAccount();
  const policy = getPolicy();
  const spent = getDailySpend();

  return NextResponse.json({
    wallet: account.publicKey.toString(),
    network: getSolanaNetwork(),
    daily_spent_usdc: spent,
    daily_limit_usdc: policy.rules.spending_limit_usdc,
    remaining_usdc: policy.rules.spending_limit_usdc - spent,
    signals_purchased: Math.round(spent / 0.001),
    policy,
  });
}
