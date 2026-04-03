# OilShock Arbitrageur

> Autonomous AI agent that pays for live oil/energy market signals via x402 micropayments on Solana mainnet, reasons about geopolitical + price data using Claude, and executes prediction market trades — governed by a spending policy.

Built for the **Agent Wallet Hackathon** (6 hours). Forked from [`x402-ai-Solana`](https://github.com/N-45div/x402-ai-Solana).

---

## What it does

1. **Pays for live data** — the agent wallet sends `$0.001 USDC` on Solana mainnet via x402 to `https://nexwave.so/api/signals` (energy perp signals: WTI, Brent Crude, Natural Gas — mark price, 24h change, volume, OI, funding rates).
2. **Reasons about oil markets** — Claude Sonnet analyzes the signals with geopolitical context (OPEC, Iran, supply disruptions) and produces a directional call: `bullish | bearish` + confidence score.
3. **Executes a trade** — places a simulated prediction market position (DFlow/Kalshi-style) and displays a Solscan explorer link.
4. **Spending policy enforced** — an OWS-style policy caps the agent at `$2.00 USDC/day`. A demo button lets you trigger a `$5.00` spend attempt and watch the policy block it.

```
User: "Run the full trading cycle"

Agent: 🔍 Fetching premium oil signals from Nexwave x402...
       💰 Paid $0.001 USDC via x402 on Solana mainnet
       📊 Received: WTI $78.42 (+1.3%), Brent $81.10, NatGas $2.94
       🧠 Analyzing with geopolitical context...
       🚨 Decision: BULLISH (confidence: 74%) — OPEC cuts + Iran supply risk
       ✅ Trade executed: YES on WTI Weekly Range · $7.40 USDC notional
```

---

## Architecture

```
Browser (Next.js)
  └─ POST /api/chat  (AI SDK useChat)
       └─ streamText (Claude Sonnet 4.6)
            ├─ Tool: fetch_oil_signals
            │    └─ wrapFetchWithPayment(fetch, solanaSigner)
            │         └─ x402 micropayment → https://nexwave.so/api/signals
            ├─ Tool: analyze_market
            │    └─ generateText (Claude as commodities analyst)
            │         └─ { direction, confidence, reason }
            └─ Tool: execute_trade
                 └─ simulated prediction market position
```

### x402 payment flow

```
Agent → GET /api/signals
Server ← 402 Payment Required (payment requirements JSON)
Agent → prepares payment header (Solana USDC transfer, signed by agent keypair)
Agent → GET /api/signals  [X-PAYMENT: <signed-header>]
        → facilitator: https://facilitator.payai.network
Server ← 200 OK + signal data
```

### Spending policy (OWS-style)

```json
{
  "id": "oilshock-arbitrageur",
  "name": "Restricted Agent Spending",
  "rules": [
    { "type": "allowed_chains", "chain_ids": ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"] },
    { "type": "spending_limits", "max_amount_usdc": "2.00", "period": "daily" }
  ],
  "action": "deny"
}
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, React 19, AI SDK v5 (`useChat`) |
| AI | Claude Sonnet 3.7 via OpenRouter (`@ai-sdk/openai`) |
| Payments | x402 protocol · `x402-fetch` · `wrapFetchWithPayment` |
| Chain | Solana mainnet (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`) |
| Asset | USDC (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`) |
| Data | Nexwave (`nexwave.so/api/signals`) — energy + crypto perp signals |
| Facilitator | `https://facilitator.payai.network` |

---

## x402 endpoint

```json
{
  "x402Version": 1,
  "baseUrl": "https://nexwave.so",
  "endpoints": [{
    "path": "/api/signals",
    "method": "GET",
    "accepts": [{
      "scheme": "exact",
      "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      "amount": "1000",
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "payTo": "7RPNsA1PotVJhaAnKcBoydNgbx7YsN9kH8VBJa2g8EW9"
    }]
  }]
}
```

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/nexwave-so/oilshock-arbitrageur.git
cd oilshock-arbitrageur
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Solana agent wallet (base64-encoded 64-byte secret key)
SOLANA_PRIVATE_KEY=<your-base64-private-key>

# Mainnet — do not change
SOLANA_NETWORK=solana
# Helius RPC (recommended for reliability)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY

# OpenRouter API key (Claude Sonnet via OpenRouter)
OPENROUTER_API_KEY=<your-key>
```

### 3. Fund the agent wallet

The agent needs mainnet USDC to pay for signals. Each signal costs `$0.001 USDC` (1000 base units). A deposit of `$0.10 USDC` gives you ~100 signal fetches.

Generate a new keypair if needed:
```bash
node -e "
  const { Keypair } = require('@solana/web3.js');
  const k = Keypair.generate();
  console.log('Private Key (base64):', Buffer.from(k.secretKey).toString('base64'));
  console.log('Public Key:', k.publicKey.toString());
"
```

The agent wallet also needs a small SOL balance (~0.001 SOL) for transaction fees.

### 4. Run

```bash
pnpm dev
# → http://localhost:3000
```

---

## Usage

Open `http://localhost:3000` and try:

- **"Run Full Trading Cycle"** — the main demo: x402 payment → signal fetch → Claude analysis → trade execution
- **"Fetch Oil Signals Only"** — just the x402 payment + raw data
- **"Analyze Current Market"** — fetch + analysis without trade
- **"Trigger Policy Block ($5.00)"** in the left sidebar — demonstrates the spending policy rejecting an over-limit transaction

---

## Project structure

```
src/
├── app/
│   ├── api/chat/route.ts     # AI SDK streamText + 3 agent tools
│   ├── layout.tsx            # Dark oil theme, OilShock header
│   ├── page.tsx              # Chat UI, spending meter, policy demo
│   └── globals.css           # Amber/orange dark theme CSS vars
├── lib/
│   ├── solana-accounts.ts    # Keypair loading, createSolanaSigner()
│   └── env.ts                # t3-env typed environment variables
└── components/
    └── ai-elements/          # AI SDK UI components (from base template)
```

---

## License

MIT
