# My first stock market simulator! 🚀
# Made by: [Your name here]

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
from my_database_stuff import SessionLocal, db_engine as engine
from my_data_classes import Base, Portfolio, Position
from my_types import TradeRequest, PortfolioResponse
from datetime import datetime
import os
import logging
import time
import random

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("stock_app")

# Create my database tables
Base.metadata.create_all(bind=engine)

# Create my app
my_app = FastAPI(title="My Cool Stock Market Game 📈")

# Static stock data - always works without any API
STOCK_DATA = {
    "AAPL": {"name": "Apple Inc.", "price": 180.75, "change": 1.35},
    "MSFT": {"name": "Microsoft Corporation", "price": 338.48, "change": 0.89},
    "GOOGL": {"name": "Alphabet Inc.", "price": 137.12, "change": -0.45},
    "AMZN": {"name": "Amazon.com Inc.", "price": 127.74, "change": 2.25},
    "TSLA": {"name": "Tesla Inc.", "price": 237.01, "change": -1.20},
    "META": {"name": "Meta Platforms Inc.", "price": 324.95, "change": 3.12},
    "NVDA": {"name": "NVIDIA Corporation", "price": 429.97, "change": 2.37},
    "NFLX": {"name": "Netflix Inc.", "price": 484.13, "change": -1.54},
    "PYPL": {"name": "PayPal Holdings Inc.", "price": 63.42, "change": -0.73},
    "INTC": {"name": "Intel Corporation", "price": 42.32, "change": 0.28},
}

# Get frontend URL from environment variable or use localhost for development
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# Allow my React app to talk to my backend
my_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
@my_app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise

# Get database connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@my_app.get("/")
def say_hello():
    logger.info("Root endpoint called")
    return {"message": "Welcome to my stock market game! 🎮"}

@my_app.get("/stock/{symbol}")
async def get_stock_info(symbol: str):
    symbol = symbol.upper()
    logger.info(f"Stock info requested for {symbol}")
    
    # Add a small delay to simulate network request
    time.sleep(0.1)
    
    # If symbol exists in our data
    if symbol in STOCK_DATA:
        # Add a tiny random price variation each time
        stock_info = STOCK_DATA[symbol].copy()
        # Add a little randomness to prices for realism
        variation = random.uniform(-2.0, 2.0)
        stock_info["price"] = round(stock_info["price"] + variation, 2)
        stock_info["change"] = round(stock_info["change"] + (variation / 10), 2)
        stock_info["symbol"] = symbol
        
        logger.info(f"Returning stock info for {symbol}: {stock_info}")
        return stock_info
    else:
        # Generate random data for unknown symbols
        price = round(random.uniform(50, 500), 2)
        change = round(random.uniform(-3, 3), 2)
        
        result = {
            "symbol": symbol,
            "price": price,
            "name": f"{symbol} Inc.",
            "change": change
        }
        
        logger.info(f"Generated random stock data for {symbol}: {result}")
        return result

@my_app.get("/my-portfolio/{user_id}")
def check_my_portfolio(user_id: int, db = Depends(get_db)):
    # Find or create new portfolio with $10,000 starting money!
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        portfolio = Portfolio(user_id=user_id, cash=10000.00)  # Free money! 🤑
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    return portfolio

@my_app.post("/make-trade")
def buy_or_sell_stock(trade: TradeRequest, db = Depends(get_db)):
    # Get user's portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == trade.user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Couldn't find your portfolio 😢")
    
    # Get current stock price using our stock API
    stock_info = get_stock_info(trade.symbol)
    current_price = stock_info["price"]
    
    # Calculate total cost
    total_cost = current_price * trade.quantity
    
    if trade.trade_type == "BUY":
        # Check if user has enough money
        if portfolio.cash < total_cost:
            raise HTTPException(status_code=400, detail="Not enough money! 💸")
        portfolio.cash -= total_cost
        
        # Add to existing position or create new one
        position = db.query(Position).filter(
            Position.portfolio_id == portfolio.id,
            Position.symbol == trade.symbol
        ).first()
        
        if position:
            position.quantity += trade.quantity
        else:
            new_position = Position(
                portfolio_id=portfolio.id,
                symbol=trade.symbol,
                quantity=trade.quantity,
                average_price=current_price
            )
            db.add(new_position)
            
    else:  # SELL
        position = db.query(Position).filter(
            Position.portfolio_id == portfolio.id,
            Position.symbol == trade.symbol
        ).first()
        
        if not position or position.quantity < trade.quantity:
            raise HTTPException(status_code=400, detail="You don't have enough shares! 📉")
        
        portfolio.cash += total_cost
        position.quantity -= trade.quantity
        
        if position.quantity == 0:
            db.delete(position)
    
    db.commit()
    return {
        "message": "Trade successful! 🎉",
        "new_balance": portfolio.cash,
        "trade_info": {
            "symbol": trade.symbol,
            "quantity": trade.quantity,
            "price": current_price,
            "total": total_cost,
            "type": trade.trade_type
        }
    } 