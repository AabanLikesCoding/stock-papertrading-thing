import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Market Simulator | Professional Trading Practice',
  description: 'A professional-grade stock market simulator for practicing trading strategies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <nav className="border-b border-zinc-800 backdrop-blur-md bg-black/30 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <a 
                href="/" 
                className="text-xl font-semibold text-white hover:scale-105 transition-transform"
              >
                Market Simulator
              </a>
              <div className="flex space-x-8">
                {[
                  ['Portfolio', '/portfolio'],
                  ['Trade', '/trade'],
                  ['History', '/history']
                ].map(([name, path]) => (
                  <a
                    key={path}
                    href={path}
                    className="text-zinc-400 hover:text-white transition-colors relative group"
                  >
                    {name}
                    <span className="absolute -bottom-1.5 left-0 w-full h-px bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
} 