import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface User {
  cash: number;
}

interface Position {
  id: number;
  symbol: string;
  shares: number;
  average_price: number;
  user_id: number;
}

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, 'portfolio.db'));

// Initialize the database
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    shares INTEGER NOT NULL,
    average_price REAL NOT NULL,
    user_id INTEGER NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cash REAL DEFAULT 100000
  );
`);

// Insert initial user if not exists
const initUser = db.prepare('INSERT OR IGNORE INTO users (id) VALUES (1)');
initUser.run();

// In-memory portfolio storage (shared with trade endpoints)
export const portfolios: {
  [userId: string]: {
    cash: number;
    holdings: {
      [symbol: string]: {
        shares: number;
        avgPrice: number;
      };
    };
  };
} = {};

// Initialize portfolio if it doesn't exist (from database or as new)
export function getOrCreatePortfolio(userId: string) {
  // If in-memory portfolio doesn't exist yet, try to load from database
  if (!portfolios[userId]) {
    // Default new portfolio
    portfolios[userId] = {
      cash: 10000,
      holdings: {}
    };
    
    // Try to load from database if it's a numeric ID
    const numericId = parseInt(userId);
    if (!isNaN(numericId)) {
      try {
        // Get user cash
        const user = db.prepare('SELECT cash FROM users WHERE id = ?').get(numericId) as User | undefined;
        if (user) {
          portfolios[userId].cash = user.cash;
        }
        
        // Get holdings
        const positions = db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(numericId) as Position[];
        positions.forEach(position => {
          portfolios[userId].holdings[position.symbol] = {
            shares: position.shares,
            avgPrice: position.average_price
          };
        });
      } catch (error) {
        console.error('Error loading portfolio from database:', error);
        // Continue with default portfolio
      }
    }
  }
  
  return portfolios[userId];
}

// Save portfolio to database for persistence
function savePortfolio(userId: string, portfolio: any) {
  const numericId = parseInt(userId);
  if (isNaN(numericId)) return; // Only save numeric IDs to database
  
  try {
    // Update cash
    db.prepare('UPDATE users SET cash = ? WHERE id = ?').run(portfolio.cash, numericId);
    
    // Clear existing positions for this user
    db.prepare('DELETE FROM portfolio WHERE user_id = ?').run(numericId);
    
    // Insert new positions
    const insertStmt = db.prepare('INSERT INTO portfolio (symbol, shares, average_price, user_id) VALUES (?, ?, ?, ?)');
    Object.entries(portfolio.holdings).forEach(([symbol, data]: [string, any]) => {
      if (data.shares > 0) {
        insertStmt.run(symbol, data.shares, data.avgPrice, numericId);
      }
    });
  } catch (error) {
    console.error('Error saving portfolio to database:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '1'; // Default to user 1 if not specified
    
    const portfolio = getOrCreatePortfolio(userId);
    
    // Calculate total portfolio value
    let totalHoldingsValue = 0;
    const holdingsWithValue = Object.entries(portfolio.holdings).map(([symbol, data]) => {
      // For a real app, we would fetch current prices here
      // Using average price for this example
      const currentValue = data.shares * data.avgPrice;
      totalHoldingsValue += currentValue;
      
      return {
        symbol,
        shares: data.shares,
        avgPrice: data.avgPrice,
        currentValue
      };
    });
    
    const totalPortfolioValue = portfolio.cash + totalHoldingsValue;
    
    return NextResponse.json({
      userId,
      cash: portfolio.cash,
      holdings: holdingsWithValue,
      totalHoldingsValue,
      totalPortfolioValue
    });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve portfolio' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId = '1', symbol, shares, price } = await request.json();
    
    if (!symbol || !shares || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, shares, price' },
        { status: 400 }
      );
    }
    
    // Update in-memory portfolio
    const portfolio = getOrCreatePortfolio(userId);
    
    if (!portfolio.holdings[symbol]) {
      portfolio.holdings[symbol] = {
        shares: 0,
        avgPrice: 0
      };
    }
    
    // Update position
    portfolio.holdings[symbol].shares += shares;
    
    // Update average price only for buys
    if (shares > 0) {
      const currentShares = portfolio.holdings[symbol].shares;
      const currentAvgPrice = portfolio.holdings[symbol].avgPrice;
      const oldValue = (currentShares - shares) * currentAvgPrice;
      const newValue = shares * price;
      portfolio.holdings[symbol].avgPrice = (oldValue + newValue) / currentShares;
    }
    
    // Remove positions with zero shares
    if (portfolio.holdings[symbol].shares <= 0) {
      delete portfolio.holdings[symbol];
    }
    
    // Save to database for persistence
    savePortfolio(userId, portfolio);
    
    return NextResponse.json({ 
      success: true,
      portfolio: {
        cash: portfolio.cash,
        holdings: portfolio.holdings
      }
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 }
    );
  }
} 