"use client";

import { useState, useEffect } from "react";
import { Metadata } from "next";
import Link from "next/link";

export default function HackathonPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const totalSlides = 8;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes staggerIn1 {
          0%,
          20% {
            opacity: 0;
            transform: translateY(10px);
          }
          40%,
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes staggerIn2 {
          0%,
          40% {
            opacity: 0;
            transform: translateY(10px);
          }
          60%,
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes staggerIn3 {
          0%,
          60% {
            opacity: 0;
            transform: translateY(10px);
          }
          80%,
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .slide {
          transition:
            opacity 0.4s ease-in-out,
            transform 0.4s ease-in-out;
        }

        .slide-enter {
          opacity: 0;
          transform: translateY(10px);
        }

        .slide-active {
          opacity: 1;
          transform: translateY(0);
        }

        .slide-exit {
          opacity: 0;
          transform: translateY(-10px);
        }

        .hint-fade {
          transition: opacity 0.5s ease-out;
        }

        .stagger-1 {
          animation: staggerIn1 2s ease-out forwards;
        }

        .stagger-2 {
          animation: staggerIn2 2s ease-out forwards;
        }

        .stagger-3 {
          animation: staggerIn3 2s ease-out forwards;
        }
      `}</style>

      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          backgroundColor: "oklch(0.08 0.008 260)",
          fontFamily: "var(--font-geist-sans)",
        }}
      >
        {/* Slide 1 - Title */}
        <div
          className={`slide absolute inset-0 flex items-center justify-center ${
            currentSlide === 0 ? "slide-active" : "slide-exit"
          }`}
          style={{
            display: currentSlide === 0 ? "flex" : "none",
          }}
        >
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-3 mb-6">
              <span
                className="font-bold"
                style={{
                  fontSize: "80px",
                  color: "oklch(0.93 0.005 260)",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                OilShock
              </span>
              <span
                className="font-normal"
                style={{
                  fontSize: "80px",
                  color: "oklch(0.78 0.12 75)",
                  fontWeight: 400,
                  lineHeight: 1,
                }}
              >
                Arbitrageur
              </span>
            </div>
            <div className="flex flex-col items-center gap-4 mb-12">
              <div
                style={{
                  width: "80px",
                  height: "1px",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                }}
              />
              <p
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "14px",
                  color: "oklch(0.52 0.008 260)",
                }}
              >
                Autonomous energy market agent
              </p>
            </div>
            <p
              className="absolute bottom-12 left-0 right-0 text-center"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "12px",
                color: "oklch(0.52 0.008 260)",
                opacity: 0.6,
              }}
            >
              Agent Wallet Hackathon · Miami 2026
            </p>
          </div>
        </div>

        {/* Slide 2 - The Problem */}
        <div
          className={`slide absolute inset-0 flex items-center justify-center ${
            currentSlide === 1 ? "slide-active" : "slide-exit"
          }`}
          style={{
            display: currentSlide === 1 ? "flex" : "none",
          }}
        >
          <div className="max-w-4xl w-full px-12">
            <h2
              className="mb-20"
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: "36px",
                fontWeight: 700,
                color: "oklch(0.93 0.005 260)",
              }}
            >
              The problem
            </h2>
            <div className="space-y-8">
              <p
                className={`stagger-1`}
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: "18px",
                  color: "oklch(0.93 0.005 260)",
                }}
              >
                AI agents can reason about markets.
              </p>
              <p
                className={`stagger-2`}
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: "18px",
                  color: "oklch(0.93 0.005 260)",
                }}
              >
                They can't pay for data.
              </p>
              <p
                className={`stagger-3`}
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: "20px",
                  color: "oklch(0.78 0.12 75)",
                }}
              >
                Until now.
              </p>
            </div>
          </div>
        </div>

        {/* Slide 3 - The Loop */}
        <div
          className={`slide absolute inset-0 flex items-center justify-center ${
            currentSlide === 2 ? "slide-active" : "slide-exit"
          }`}
          style={{
            display: currentSlide === 2 ? "flex" : "none",
          }}
        >
          <div className="max-w-4xl w-full px-12">
            <h2
              className="mb-16"
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: "36px",
                fontWeight: 700,
                color: "oklch(0.93 0.005 260)",
              }}
            >
              The loop
            </h2>
            <div className="space-y-0">
              {[
                {
                  num: "01",
                  text: "Query Kalshi prediction markets via DFlow",
                },
                {
                  num: "02",
                  text: "Pay $0.001 USDC via x402 → live energy signals",
                },
                { num: "03", text: "Claude reasons on signals + geopolitics" },
                { num: "04", text: "Execute trade on Solana" },
              ].map((step, idx) => (
                <div key={idx}>
                  <div className="flex items-baseline gap-6 py-3">
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "oklch(0.78 0.12 75)",
                        minWidth: "32px",
                      }}
                    >
                      {step.num}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-sans)",
                        fontSize: "16px",
                        color: "oklch(0.93 0.005 260)",
                      }}
                    >
                      {step.text}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className="ml-4"
                      style={{
                        width: "1px",
                        height: "24px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <p
              className="mt-12"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "12px",
                color: "oklch(0.62 0.14 180)",
              }}
            >
              Every payment is real. Solana mainnet. Not a simulation.
            </p>
          </div>
        </div>

        {/* Slide 4 - x402 Payment Flow */}
        <div
          className={`slide absolute inset-0 flex items-center justify-center ${
            currentSlide === 3 ? "slide-active" : "slide-exit"
          }`}
          style={{
            display: currentSlide === 3 ? "flex" : "none",
          }}
        >
          <div className="max-w-5xl w-full px-12">
            <h2
              className="mb-16"
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: "36px",
                fontWeight: 700,
                color: "oklch(0.93 0.005 260)",
              }}
            >
              x402 in action
            </h2>
            <div
              className="space-y-3"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "13px",
              }}
            >
              <div className="flex justify-between gap-12">
                <span style={{ color: "oklch(0.93 0.005 260)" }}>
                  <span style={{ color: "oklch(0.78 0.12 75)" }}>GET</span>{" "}
                  nexwave.so/api/signals
                </span>
                <span
                  className="text-right"
                  style={{ color: "oklch(0.52 0.008 260)" }}
                >
                  <span
                    className="mr-2"
                    style={{ color: "oklch(0.52 0.008 260)" }}
                  >
                    →
                  </span>
                  <span style={{ color: "oklch(0.58 0.16 25)" }}>402</span>{" "}
                  Payment Required
                </span>
              </div>
              <div
                className="pl-12 text-right space-y-1"
                style={{ color: "oklch(0.52 0.008 260)" }}
              >
                <div>amount: 1000 ($0.001)</div>
                <div>network: solana mainnet</div>
                <div>payTo: 7RPN...8EW9</div>
              </div>

              <div className="py-2" />

              <div className="flex justify-between gap-12">
                <span style={{ color: "oklch(0.93 0.005 260)" }}>
                  OWS Policy Engine
                </span>
                <span style={{ color: "oklch(0.62 0.14 180)" }}>
                  <span
                    className="mr-2"
                    style={{ color: "oklch(0.52 0.008 260)" }}
                  >
                    →
                  </span>
                  ✓ Approved ($0.003 of $2.00 used)
                </span>
              </div>

              <div className="py-2" />

              <div className="flex justify-between gap-12">
                <span style={{ color: "oklch(0.93 0.005 260)" }}>
                  <span style={{ color: "oklch(0.78 0.12 75)" }}>GET</span>{" "}
                  nexwave.so/api/signals
                </span>
                <span
                  className="text-right"
                  style={{ color: "oklch(0.52 0.008 260)" }}
                >
                  <span
                    className="mr-2"
                    style={{ color: "oklch(0.52 0.008 260)" }}
                  >
                    →
                  </span>
                  <span style={{ color: "oklch(0.62 0.14 180)" }}>200</span> OK
                </span>
              </div>
              <div
                className="pl-12 text-right space-y-1"
                style={{ color: "oklch(0.52 0.008 260)" }}
              >
                <div>X-PAYMENT: &lt;signed header&gt;</div>
              </div>
              <div
                className="text-right space-y-1"
                style={{ color: "oklch(0.52 0.008 260)" }}
              >
                <div>WTI: $78.42 (+1.3%)</div>
                <div>Brent: $81.10</div>
                <div>NatGas: $2.94</div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 5 - OWS Policy Engine */}
        <div
          className={`slide absolute inset-0 flex items-center justify-center ${
            currentSlide === 4 ? "slide-active" : "slide-exit"
          }`}
          style={{
            display: currentSlide === 4 ? "flex" : "none",
          }}
        >
          <div className="max-w-4xl w-full px-12">
            <h2
              className="mb-16"
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: "36px",
                fontWeight: 700,
                color: "oklch(0.93 0.005 260)",
              }}
            >
              Spending guardrails
            </h2>
            <div
              className="space-y-3 mb-12"
              style={{
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {[
                {
                  label: "POLICY ID",
                  value: "oilshock-arbitrageur",
                },
                {
                  label: "ALLOWED CHAIN",
                  value: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
                },
                { label: "DAILY CAP", value: "$2.00 USDC" },
                { label: "ENFORCEMENT", value: "deny — block before signing" },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-8">
                  <span
                    className="uppercase"
                    style={{
                      fontSize: "11px",
                      color: "oklch(0.52 0.008 260)",
                      minWidth: "140px",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "oklch(0.93 0.005 260)",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-8 mt-16">
              <div
                style={{
                  borderLeft: "4px solid oklch(0.62 0.14 180)",
                  paddingLeft: "16px",
                }}
              >
                <div
                  className="mb-3"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "oklch(0.62 0.14 180)",
                    letterSpacing: "0.05em",
                  }}
                >
                  APPROVED
                </div>
                <div
                  className="mb-2"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "14px",
                    color: "oklch(0.93 0.005 260)",
                  }}
                >
                  $0.001 signal fetch
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "12px",
                    color: "oklch(0.52 0.008 260)",
                  }}
                >
                  Within daily cap
                </div>
              </div>

              <div
                style={{
                  borderLeft: "4px solid oklch(0.58 0.16 25)",
                  paddingLeft: "16px",
                }}
              >
                <div
                  className="mb-3"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "oklch(0.58 0.16 25)",
                    letterSpacing: "0.05em",
                  }}
                >
                  BLOCKED
                </div>
                <div
                  className="mb-2"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "14px",
                    color: "oklch(0.93 0.005 260)",
                  }}
                >
                  $5.00 bulk purchase
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "12px",
                    color: "oklch(0.52 0.008 260)",
                  }}
                >
                  Exceeds $2.00 daily limit
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 6 - Sponsor Tech Stack */}
        <div
          className={`slide absolute inset-0 flex items-center justify-center ${
            currentSlide === 5 ? "slide-active" : "slide-exit"
          }`}
          style={{
            display: currentSlide === 5 ? "flex" : "none",
          }}
        >
          <div className="max-w-4xl w-full px-12">
            <h2
              className="mb-16"
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: "36px",
                fontWeight: 700,
                color: "oklch(0.93 0.005 260)",
              }}
            >
              Built with
            </h2>
            <div className="grid grid-cols-2 gap-x-16 gap-y-8">
              {[
                {
                  name: "x402 Protocol",
                  desc: "HTTP-native micropayments",
                },
                {
                  name: "Open Wallet Standard",
                  desc: "Policy-gated agent spending",
                },
                {
                  name: "DFlow / Kalshi",
                  desc: "Prediction market data",
                },
                { name: "Solana", desc: "Mainnet settlement" },
                {
                  name: "Claude (Anthropic)",
                  desc: "Commodities analysis",
                },
                {
                  name: "Nexwave (our x402 server)",
                  desc: "Live energy signal feed",
                },
                { name: "Vercel", desc: "Deployment" },
                {
                  name: "x402-ai-Solana starter",
                  desc: "Fork base",
                },
              ].map((tech, idx) => (
                <div key={idx}>
                  <div
                    className="mb-2"
                    style={{
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: "18px",
                      fontWeight: 500,
                      color: "oklch(0.93 0.005 260)",
                    }}
                  >
                    {tech.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "12px",
                      color: "oklch(0.52 0.008 260)",
                    }}
                  >
                    {tech.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide 7 - Why This Wins */}
        <div
          className={`slide absolute inset-0 flex items-center justify-center ${
            currentSlide === 6 ? "slide-active" : "slide-exit"
          }`}
          style={{
            display: currentSlide === 6 ? "flex" : "none",
          }}
        >
          <div className="max-w-4xl w-full px-12">
            <h2
              className="mb-16"
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: "36px",
                fontWeight: 700,
                color: "oklch(0.93 0.005 260)",
              }}
            >
              Why this wins
            </h2>
            <div className="space-y-10">
              {[
                {
                  num: "01",
                  title: "Real payments, not mocked",
                  desc: "Every x402 call moves real USDC on Solana mainnet",
                },
                {
                  num: "02",
                  title: "We're both sides",
                  desc: "We built the x402 merchant AND the agent that pays it",
                },
                {
                  num: "03",
                  title: "Server-side policy enforcement",
                  desc: "OWS policy checks run before signing, not in the UI",
                },
              ].map((point, idx) => (
                <div key={idx} className="flex gap-6">
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "16px",
                      fontWeight: 500,
                      color: "oklch(0.78 0.12 75)",
                      minWidth: "32px",
                    }}
                  >
                    {point.num}
                  </span>
                  <div>
                    <div
                      className="mb-2"
                      style={{
                        fontFamily: "var(--font-geist-sans)",
                        fontSize: "18px",
                        fontWeight: 500,
                        color: "oklch(0.93 0.005 260)",
                      }}
                    >
                      {point.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-geist-sans)",
                        fontSize: "15px",
                        color: "oklch(0.52 0.008 260)",
                      }}
                    >
                      {point.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide 8 - Live Demo + Links */}
        <div
          className={`slide absolute inset-0 flex items-center justify-center ${
            currentSlide === 7 ? "slide-active" : "slide-exit"
          }`}
          style={{
            display: currentSlide === 7 ? "flex" : "none",
          }}
        >
          <div className="text-center">
            <h2
              className="mb-12"
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: "36px",
                fontWeight: 700,
                color: "oklch(0.93 0.005 260)",
              }}
            >
              Try it
            </h2>
            <div className="mb-12">
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-lg"
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "oklch(0.93 0.005 260)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.78 0.12 75)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.02)";
                }}
              >
                Launch agent
              </Link>
            </div>
            <div
              className="space-y-2 mb-12"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "13px",
                color: "oklch(0.52 0.008 260)",
              }}
            >
              <div>github.com/nexwave-so/oilshock-arbitrageur</div>
              <div>nexwave.so/api/signals</div>
              <div>nexwave.so</div>
            </div>
            <p
              className="absolute bottom-12 left-0 right-0 text-center"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "11px",
                color: "oklch(0.52 0.008 260)",
                opacity: 0.6,
              }}
            >
              Built by Nexwave · Agent Wallet Hackathon · Miami, April 2026
            </p>
          </div>
        </div>

        {/* Slide counter */}
        <div
          className="fixed bottom-6 right-6"
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "11px",
            color: "oklch(0.52 0.008 260)",
          }}
        >
          {currentSlide + 1} / {totalSlides}
        </div>

        {/* Navigation hint */}
        <div
          className={`fixed bottom-6 left-6 hint-fade ${
            showHint ? "opacity-100" : "opacity-0"
          }`}
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "11px",
            color: "oklch(0.52 0.008 260)",
          }}
        >
          ← →
        </div>
      </div>
    </>
  );
}
