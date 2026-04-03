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
    label: "Run Full Trading Cycle",
    prompt:
      "Run the full OilShock trading cycle: check Kalshi prediction markets, fetch live oil signals via x402 (OWS policy check first), analyze the market with prediction market context, then execute a trade.",
  },
  {
    label: "Check Kalshi Markets",
    prompt:
      "What prediction markets are available for oil and energy? Show me the current odds on WTI and Brent.",
  },
  {
    label: "Fetch Oil Signals Only",
    prompt:
      "Fetch live oil and energy market signals from Nexwave via x402 payment. Show me the raw data.",
  },
  {
    label: "Check Spending Status",
    prompt:
      "Check the current OWS policy spending status. How much of the $2.00 daily budget has been used?",
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

  // Count completed fetch_oil_signals calls to track spend locally.
  // AI SDK v5: inline tool parts use type "tool-<toolName>" and state "output-available".
  useEffect(() => {
    let count = 0;
    for (const msg of messages) {
      for (const part of msg.parts) {
        if (
          part.type === "tool-fetch_oil_signals" &&
          (part as any).state === "output-available"
        ) {
          count++;
        }
      }
    }
    setDailySpend(count * COST_PER_SIGNAL);
  }, [messages]);

  // Sync spend from server after each completed agent turn.
  // Server state is authoritative — it's incremented by the real policy engine.
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      fetch("/api/status")
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.daily_spent_usdc === "number") {
            setDailySpend(data.daily_spent_usdc);
          }
        })
        .catch(() => {/* non-fatal — local count is the fallback */});
    }
  }, [status, messages.length]);

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
      <aside className="hidden lg:flex flex-col w-72 border-r shrink-0 p-6 gap-8" style={{ borderColor: 'oklch(0.22 0.01 260 / 30%)', backgroundColor: 'oklch(0.09 0.008 260)' }}>
        {/* Spending Policy Card */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'oklch(0.52 0.008 260)' }}>
            OWS Policy
          </div>
          <dl className="space-y-2.5 font-mono text-[13px]">
            <div className="flex justify-between">
              <dt className="uppercase text-[10px]" style={{ color: 'oklch(0.52 0.008 260)' }}>POLICY</dt>
              <dd className="text-white">{SPENDING_POLICY.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="uppercase text-[10px]" style={{ color: 'oklch(0.52 0.008 260)' }}>CHAIN</dt>
              <dd className="text-white truncate ml-3" title="solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp">
                solana:5eykt...Kvdp
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="uppercase text-[10px]" style={{ color: 'oklch(0.52 0.008 260)' }}>DAILY CAP</dt>
              <dd className="text-white">$2.00 USDC</dd>
            </div>
            <div className="flex justify-between">
              <dt className="uppercase text-[10px]" style={{ color: 'oklch(0.52 0.008 260)' }}>ENFORCEMENT</dt>
              <dd className="text-white">deny on violation</dd>
            </div>
          </dl>
        </div>

        {/* Daily Budget Meter */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'oklch(0.52 0.008 260)' }}>
            Daily Budget
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono font-medium text-[28px] text-white">
              ${dailySpend.toFixed(3)}
            </span>
            <span className="font-mono text-[12px]" style={{ color: 'oklch(0.52 0.008 260)' }}>
              of ${DAILY_LIMIT_USDC.toFixed(2)}
            </span>
          </div>
          <div className="w-full rounded-full h-[3px]" style={{ backgroundColor: 'oklch(0.16 0.012 260)' }}>
            <div
              className="h-[3px] rounded-full transition-all duration-500"
              style={{
                width: `${spendPct}%`,
                backgroundColor: spendPct > 80
                  ? 'oklch(0.58 0.16 25)'
                  : spendPct > 50
                  ? 'oklch(0.78 0.12 75)'
                  : 'oklch(0.62 0.14 180)'
              }}
            />
          </div>
          <div className="font-mono text-[11px]" style={{ color: 'oklch(0.42 0.008 260)' }}>
            {Math.floor(dailySpend / COST_PER_SIGNAL)} signals · $0.001 each
          </div>
        </div>

        {/* Policy Block Demo */}
        <div className="space-y-3">
          <button
            onClick={handlePolicyTest}
            className="w-full py-2.5 px-3 rounded border font-mono text-[12px] transition-all duration-150"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.08)',
              borderStyle: 'dashed',
              color: 'oklch(0.52 0.008 260)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderStyle = 'solid';
              e.currentTarget.style.color = 'oklch(0.58 0.16 25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderStyle = 'dashed';
              e.currentTarget.style.color = 'oklch(0.52 0.008 260)';
            }}
          >
            Test $5.00 overspend
          </button>
          {policyTestMsg && (
            <div className="p-3 font-mono text-[11px] text-white" style={{
              borderLeft: '4px solid oklch(0.58 0.16 25)',
              backgroundColor: 'oklch(0.10 0.008 260)'
            }}>
              {policyTestMsg}
            </div>
          )}
        </div>

        {/* x402 Info */}
        <div className="mt-auto space-y-1 font-mono text-[11px]" style={{ color: 'oklch(0.42 0.008 260)' }}>
          <div>nexwave.so/api/signals</div>
          <div>USDC · Solana · $0.001/call</div>
          <div>facilitator: payai.network</div>
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
          <div className="mb-6 text-center pt-16">
            <h1 className="font-bold text-[48px] leading-none tracking-[-0.03em] mb-1">
              <div className="text-white">OilShock</div>
              <div style={{ color: 'oklch(0.78 0.12 75)' }}>Arbitrageur</div>
            </h1>
            <p className="text-[15px] mt-6 mb-8" style={{ color: 'oklch(0.52 0.008 260)' }}>
              Autonomous energy market agent · x402 · OWS · Solana mainnet
            </p>

            {/* Suggestion buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s.prompt)}
                  className="px-4 py-2.5 rounded font-medium text-[13px] border transition-all duration-150"
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'oklch(0.68 0.008 260)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = 'oklch(0.68 0.008 260)';
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="max-w-3xl mx-auto">
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
              <div className="text-sm p-3 rounded font-mono" style={{
                color: 'oklch(0.58 0.16 25)',
                borderLeft: '4px solid oklch(0.58 0.16 25)',
                backgroundColor: 'oklch(0.10 0.008 260)'
              }}>
                Agent error — check console and verify OPENROUTER_API_KEY + SOLANA_PRIVATE_KEY are set
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input */}
        <div className="max-w-3xl mx-auto w-full border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
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
              <div className="font-mono text-[11px]" style={{ color: 'oklch(0.52 0.008 260)' }}>
                Claude Sonnet · Solana mainnet
              </div>
              <PromptInputSubmit disabled={!input} status={status} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
