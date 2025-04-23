import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'portfolio.db'));

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
    const portfolio = db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(1);
    const user = db.prepare('SELECT cash FROM users WHERE id = ?').get(1);
    
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