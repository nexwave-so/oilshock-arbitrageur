import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OilShock Arbitrageur — Autonomous Agent Wallet",
  description:
    "Autonomous AI agent that pays for live oil signals via x402 on Solana mainnet, reasons about geopolitical data, and executes prediction market trades — governed by a spending policy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <div className="size-full flex flex-col bg-[#0a0a0f]">
          <header className="border-b border-amber-900/40 bg-[#0d0d14]/90 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-900/40">
                    <span className="text-white font-bold text-lg">⚡</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white tracking-tight">
                      OilShock Arbitrageur
                    </div>
                    <div className="text-xs text-amber-500/80 font-mono">
                      x402 · Solana mainnet · Agent Wallet
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live on mainnet
                  </span>
                  <span className="text-slate-700">·</span>
                  <span>Powered by Claude + x402</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
