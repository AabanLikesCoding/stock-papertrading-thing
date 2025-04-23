'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center space-y-12 animate-fade-in">
      <h1 className="text-5xl font-bold text-white mt-16 transition-all hover:scale-105">
        Welcome to Market Simulator
      </h1>
      <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
        Practice trading with $10,000 in virtual capital. Experience real-time market data without the risk.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
        <Link href="/portfolio" className="group">
          <div className="bg-black p-8 rounded-lg border border-zinc-800 transition-all duration-300
                        group-hover:border-zinc-600 h-full transform group-hover:scale-[1.02]">
            <h2 className="text-2xl font-semibold text-white mb-4">Portfolio Management</h2>
            <p className="text-zinc-400 mb-6">Track your investments and monitor your performance in real-time.</p>
            <span className="inline-block px-4 py-2 bg-zinc-900 text-white rounded
                         transition-all duration-200 group-hover:bg-zinc-800 border border-zinc-800 group-hover:border-white">
              View Portfolio
            </span>
          </div>
        </Link>

        <Link href="/trade" className="group">
          <div className="bg-black p-8 rounded-lg border border-zinc-800 transition-all duration-300
                        group-hover:border-zinc-600 h-full transform group-hover:scale-[1.02]">
            <h2 className="text-2xl font-semibold text-white mb-4">Trade Stocks</h2>
            <p className="text-zinc-400 mb-6">Execute trades with real-time market data and instant execution.</p>
            <span className="inline-block px-4 py-2 bg-zinc-900 text-white rounded
                         transition-all duration-200 group-hover:bg-zinc-800 border border-zinc-800 group-hover:border-white">
              Start Trading
            </span>
          </div>
        </Link>

        <Link href="/history" className="group">
          <div className="bg-black p-8 rounded-lg border border-zinc-800 transition-all duration-300
                        group-hover:border-zinc-600 h-full transform group-hover:scale-[1.02]">
            <h2 className="text-2xl font-semibold text-white mb-4">Trading History</h2>
            <p className="text-zinc-400 mb-6">Review your past trades and analyze your trading patterns.</p>
            <span className="inline-block px-4 py-2 bg-zinc-900 text-white rounded
                         transition-all duration-200 group-hover:bg-zinc-800 border border-zinc-800 group-hover:border-white">
              View History
            </span>
          </div>
        </Link>
      </div>

      <div className="bg-black p-8 rounded-lg border border-zinc-800 max-w-3xl mx-auto mt-12
                    transition-all hover:border-zinc-600">
        <h2 className="text-2xl font-semibold text-white mb-6">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">1. Portfolio Setup</h3>
            <p className="text-zinc-400">Start with $10,000 in virtual capital to build your investment portfolio.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">2. Market Research</h3>
            <p className="text-zinc-400">Access real-time market data and set price alerts for your favorite stocks.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">3. Execute Trades</h3>
            <p className="text-zinc-400">Buy and sell stocks with our intuitive trading interface.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 