'use client';

export default function History() {
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 transition-all hover:scale-105">Trading History</h1>

      <div className="text-center py-12 bg-black rounded-lg border border-zinc-800">
        <p className="text-zinc-400">Trading history is not available in this version.</p>
        <a
          href="/trade"
          className="inline-block mt-4 px-6 py-3 bg-zinc-900 text-white rounded
                   hover:bg-zinc-800 transition-all duration-200 transform hover:scale-105
                   border border-zinc-800 hover:border-white"
        >
          Return to Trading
        </a>
      </div>
    </div>
  );
} 