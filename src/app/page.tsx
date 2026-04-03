"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

// Spending policy config
const DAILY_LIMIT_USDC = 2.0;
const COST_PER_SIGNAL = 0.001;

const SPENDING_POLICY = {
  id: "oilshock-arbitrageur",
  name: "Restricted Agent Spending",
  rules: [
    {
      type: "allowed_chains",
      chain_ids: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
    },
    {
      type: "spending_limits",
      max_amount_usdc: "2.00",
      period: "daily",
    },
  ],
  action: "deny",
};

const SUGGESTIONS = [
  {
    icon: "⚡",
    label: "Run Full Trading Cycle",
    prompt:
      "Run the full OilShock trading cycle: fetch live oil signals via x402, analyze the market with geopolitical context, then execute a trade.",
  },
  {
    icon: "🔍",
    label: "Fetch Oil Signals Only",
    prompt:
      "Fetch live oil and energy market signals from Nexwave via x402 payment. Show me the raw data.",
  },
  {
    icon: "🧠",
    label: "Analyze Current Market",
    prompt:
      "Fetch the latest oil signals and analyze current market conditions. What's your directional call on WTI for the next 24 hours?",
  },
];

export default function OilShockArbitrageur() {
  const [input, setInput] = useState("");
  const [dailySpend, setDailySpend] = useState(0);
  const [policyBlockMsg, setPolicyBlockMsg] = useState<string | null>(null);
  const [policyTestMsg, setPolicyTestMsg] = useState<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Count fetch_oil_signals tool calls to track spend
  useEffect(() => {
    let count = 0;
    for (const msg of messages) {
      for (const part of msg.parts) {
        if (
          (part.type === "dynamic-tool" || part.type.startsWith("tool-")) &&
          // @ts-expect-error
          part.toolName === "fetch_oil_signals" &&
          // @ts-expect-error
          part.state === "result"
        ) {
          count++;
        }
      }
    }
    setDailySpend(count * COST_PER_SIGNAL);
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Enforce spending policy before sending
    if (dailySpend >= DAILY_LIMIT_USDC) {
      setPolicyBlockMsg(
        `🚫 OWS Policy blocked — daily limit of $${DAILY_LIMIT_USDC.toFixed(2)} reached`
      );
      return;
    }
    setPolicyBlockMsg(null);
    sendMessage({ text: input });
    setInput("");
  };

  const handleSuggestion = (prompt: string) => {
    if (dailySpend >= DAILY_LIMIT_USDC) {
      setPolicyBlockMsg(
        `🚫 OWS Policy blocked — daily limit of $${DAILY_LIMIT_USDC.toFixed(2)} reached`
      );
      return;
    }
    setPolicyBlockMsg(null);
    sendMessage({ text: prompt });
  };

  const handlePolicyTest = () => {
    const attemptedAmount = 5.0;
    if (dailySpend + attemptedAmount > DAILY_LIMIT_USDC) {
      setPolicyTestMsg(
        `🚫 OWS Policy blocked — attempted $${attemptedAmount.toFixed(2)} exceeds $${DAILY_LIMIT_USDC.toFixed(2)} daily limit`
      );
    } else {
      setPolicyTestMsg(null);
    }
    // Auto-clear after 4s
    setTimeout(() => setPolicyTestMsg(null), 4000);
  };

  const spendPct = Math.min((dailySpend / DAILY_LIMIT_USDC) * 100, 100);

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Left: Policy Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-amber-900/30 bg-[#0d0d14] p-4 gap-4 shrink-0">
        {/* Spending Policy Card */}
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400 text-sm">🛡️</span>
            <span className="text-amber-300 text-sm font-semibold">
              OWS Spending Policy
            </span>
          </div>
          <div className="font-mono text-xs text-slate-400 bg-slate-900/60 rounded p-3 overflow-auto max-h-48">
            <pre>{JSON.stringify(SPENDING_POLICY, null, 2)}</pre>
          </div>
        </div>

        {/* Daily Budget Meter */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-slate-400 text-xs mb-2 font-mono">
            Daily Budget
          </div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-white text-lg font-bold font-mono">
              ${dailySpend.toFixed(3)}
            </span>
            <span className="text-slate-500 text-xs font-mono">
              / ${DAILY_LIMIT_USDC.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                spendPct > 80
                  ? "bg-red-500"
                  : spendPct > 50
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${spendPct}%` }}
            />
          </div>
          <div className="text-slate-600 text-xs mt-2 font-mono">
            {Math.floor(dailySpend / COST_PER_SIGNAL)} signal
            {Math.floor(dailySpend / COST_PER_SIGNAL) !== 1 ? "s" : ""} fetched
            · $0.001 USDC each
          </div>
        </div>

        {/* Policy Block Demo */}
        <div className="rounded-lg border border-red-900/40 bg-red-950/10 p-4">
          <div className="text-red-400 text-xs font-semibold mb-2">
            🧪 Demo: Policy Guard
          </div>
          <p className="text-slate-500 text-xs mb-3">
            Simulate a $5.00 spend attempt — the policy should block it.
          </p>
          <button
            onClick={handlePolicyTest}
            className="w-full py-2 px-3 rounded border border-red-800/60 bg-red-900/20 text-red-400 text-xs font-mono hover:bg-red-900/40 transition-colors"
          >
            Trigger Policy Block ($5.00)
          </button>
          {policyTestMsg && (
            <div className="mt-2 p-2 rounded bg-red-900/30 border border-red-700/50 text-red-300 text-xs font-mono">
              {policyTestMsg}
            </div>
          )}
        </div>

        {/* x402 Info */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/20 p-3 mt-auto">
          <div className="text-slate-500 text-xs space-y-1 font-mono">
            <div className="text-slate-400 font-semibold mb-1">x402 Config</div>
            <div>
              Endpoint:{" "}
              <span className="text-amber-400/80">nexwave.so/api/signals</span>
            </div>
            <div>
              Asset:{" "}
              <span className="text-slate-300">USDC · Solana mainnet</span>
            </div>
            <div>
              Cost: <span className="text-green-400">$0.001 / call</span>
            </div>
            <div>
              Facilitator:{" "}
              <span className="text-slate-300">payai.network</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right: Chat ── */}
      <div className="flex-1 flex flex-col min-w-0 p-4">
        {/* Policy block banner */}
        {policyBlockMsg && (
          <div className="mb-3 px-4 py-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm font-mono">
            {policyBlockMsg}
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="mb-6 text-center pt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-mono text-amber-400 mb-4">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              x402 · Solana mainnet · Agent ready
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              OilShock Arbitrageur
            </h1>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mb-6">
              Autonomous AI agent that pays for live oil signals via x402
              micropayments, reasons about geopolitical data using Claude, and
              executes prediction market trades — governed by a $2/day spending
              policy.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
              <div className="p-3 rounded-lg border border-amber-900/30 bg-amber-950/10 text-left">
                <div className="text-amber-400 text-lg mb-1">💰</div>
                <div className="text-white text-sm font-medium">x402 Payments</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  $0.001 USDC per signal on Solana mainnet
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 text-left">
                <div className="text-blue-400 text-lg mb-1">🧠</div>
                <div className="text-white text-sm font-medium">Claude Analysis</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  Geopolitical + technical reasoning
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 text-left">
                <div className="text-green-400 text-lg mb-1">🛡️</div>
                <div className="text-white text-sm font-medium">Spending Policy</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  OWS-enforced $2/day cap
                </div>
              </div>
            </div>

            {/* Suggestion buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s.prompt)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-800/40 bg-amber-950/20 text-amber-300 text-sm hover:bg-amber-950/40 hover:border-amber-700/60 transition-colors"
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <Conversation className="flex-1 min-h-0">
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <Response key={`${message.id}-${i}`}>
                          {part.text}
                        </Response>
                      );
                    } else if (part.type === "reasoning") {
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === "streaming"}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    } else if (
                      part.type === "dynamic-tool" ||
                      part.type.startsWith("tool-")
                    ) {
                      return (
                        <Tool defaultOpen={true} key={`${message.id}-${i}`}>
                          {/* @ts-expect-error */}
                          <ToolHeader part={part} />
                          <ToolContent>
                            {/* @ts-expect-error */}
                            <ToolInput input={part.input} />
                            <ToolOutput
                              // @ts-expect-error
                              part={part}
                              // @ts-expect-error
                              network={message.metadata?.network}
                            />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))}
            {status === "submitted" && <Loader />}
            {status === "error" && (
              <div className="text-red-400 text-sm p-3 rounded border border-red-900/40 bg-red-950/20 font-mono">
                ❌ Agent error — check console and verify ANTHROPIC_API_KEY +
                SOLANA_PRIVATE_KEY are set
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input */}
        <PromptInput onSubmit={handleSubmit} className="mt-3">
          <PromptInputTextarea
            placeholder="Ask OilShock Arbitrageur to run a trading cycle..."
            onChange={(e) => setInput(e.target.value)}
            value={input}
            ref={(ref) => {
              if (ref) ref.focus();
            }}
          />
          <PromptInputToolbar>
            <div className="text-xs text-slate-600 font-mono">
              Claude Sonnet · Solana mainnet
            </div>
            <PromptInputSubmit disabled={!input} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
