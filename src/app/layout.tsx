import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
        className={`${dmSans.variable} ${jetbrainsMono.variable} antialiased h-full`}
      >
        <div className="size-full flex flex-col">
          <header className="border-b border-white/[0.06] h-[52px] flex items-center">
            <div className="w-full px-6 flex items-center justify-between">
              {/* Wordmark */}
              <div className="flex items-center">
                <span className="text-[17px] font-bold tracking-[-0.02em] text-white">
                  OilShock
                </span>
                <span className="text-[17px] font-normal ml-1.5" style={{ color: 'oklch(0.78 0.12 75)' }}>
                  Arbitrageur
                </span>
              </div>

              {/* Status row */}
              <div className="hidden sm:flex items-center gap-2.5 font-mono text-[11px]" style={{ color: 'oklch(0.52 0.008 260)' }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'oklch(0.62 0.14 180)' }} />
                  <span>Mainnet</span>
                </span>
                <span className="opacity-40">|</span>
                <span>x402</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
