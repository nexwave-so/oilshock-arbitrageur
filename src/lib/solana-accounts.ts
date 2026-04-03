import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
import { env } from "./env";

// USDC mint addresses for different Solana networks
const USDC_MINT_ADDRESSES = {
  "solana-devnet": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC on devnet
  "solana": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on mainnet
} as const;

let connection: Connection;
let purchaserKeypair: Keypair;
let sellerKeypair: Keypair;

function getConnection(): Connection {
  if (!connection) {
    const rpcUrl = env.SOLANA_RPC_URL || getDefaultRpcUrl(env.SOLANA_NETWORK);
    connection = new Connection(rpcUrl, "confirmed");
  }
  return connection;
}

function getDefaultRpcUrl(network: string): string {
  switch (network) {
    case "solana-devnet":
      return "https://api.devnet.solana.com";
    case "solana":
      return "https://api.mainnet-beta.solana.com";
    default:
      return "https://api.devnet.solana.com";
  }
}

function getUsdcMintAddress(): PublicKey {
  const mintAddress = USDC_MINT_ADDRESSES[env.SOLANA_NETWORK as keyof typeof USDC_MINT_ADDRESSES];
  if (!mintAddress) {
    throw new Error(`USDC mint address not found for network: ${env.SOLANA_NETWORK}`);
  }
  return new PublicKey(mintAddress);
}

export async function getOrCreatePurchaserAccount() {
  if (!purchaserKeypair) {
    // For now, we'll use the same private key for both purchaser and seller
    // In a real app, you'd want separate keys
    const privateKeyBytes = Buffer.from(env.SOLANA_PRIVATE_KEY, "base64");
    purchaserKeypair = Keypair.fromSecretKey(privateKeyBytes);
  }

  // Check SOL balance and request airdrop if needed (devnet only)
  if (env.SOLANA_NETWORK === "solana-devnet") {
    await ensureSolBalance(purchaserKeypair.publicKey);
  }

  return purchaserKeypair;
}

export async function getOrCreateSellerAccount() {
  if (!sellerKeypair) {
    // For demo purposes, create a new keypair for the seller
    // In production, you'd load this from a secure source
    sellerKeypair = Keypair.generate();
  }

  return sellerKeypair;
}

export function getPurchaserPrivateKey(): string {
  return Buffer.from(env.SOLANA_PRIVATE_KEY, "base64").toString("base64");
}

export async function createSolanaSigner() {
  const { createSigner } = await import("x402/types");
  const keypair = await getOrCreatePurchaserAccount();
  const network = getSolanaNetwork();
  
  // For Solana, x402 expects the private key as a base58 string
  // The keypair.secretKey is a Uint8Array of 64 bytes (32 bytes private key + 32 bytes public key)
  const privateKeyBase58 = bs58.encode(keypair.secretKey);
  
  return createSigner(network, privateKeyBase58);
}

export async function createSolanaPaymentClient() {
  const { createPaymentHeader, preparePaymentHeader } = await import("x402/client");
  const signer = await createSolanaSigner();
  
  return {
    createPaymentHeader,
    preparePaymentHeader,
    signer,
  };
}

async function ensureSolBalance(publicKey: PublicKey, minBalance = 0.1) {
  const connection = getConnection();
  const balance = await connection.getBalance(publicKey);
  const balanceInSol = balance / LAMPORTS_PER_SOL;

  if (balanceInSol < minBalance) {
    console.log(`SOL balance (${balanceInSol}) below minimum (${minBalance}), requesting airdrop...`);
    try {
      const signature = await connection.requestAirdrop(
        publicKey,
        LAMPORTS_PER_SOL // Request 1 SOL
      );
      await connection.confirmTransaction(signature);
      console.log(`Airdrop successful: ${signature}`);
    } catch (error) {
      console.warn("Airdrop failed:", error);
      // Continue anyway, as the user might have enough balance for transactions
    }
  }
}

export async function getUsdcTokenAddress(walletAddress: PublicKey): Promise<PublicKey> {
  const usdcMint = getUsdcMintAddress();
  return await getAssociatedTokenAddress(usdcMint, walletAddress);
}

export function getSolanaNetwork() {
  return env.SOLANA_NETWORK;
}

export function getUsdcMint() {
  return getUsdcMintAddress();
}
