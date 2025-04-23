import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const portfolio = db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(1) as Position[];
    const user = db.prepare('SELECT cash FROM users WHERE id = ?').get(1) as User;
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      cash: user.cash,
      positions: portfolio
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { symbol, shares, price } = await request.json();
    
    const stmt = db.prepare(`
      INSERT INTO portfolio (symbol, shares, average_price, user_id)
      VALUES (?, ?, ?, 1)
    `);
    
    stmt.run(symbol, shares, price);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 }
    );
  }
} 