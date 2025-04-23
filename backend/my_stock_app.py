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

# Alpha Vantage API Key - you can get a free one from https://www.alphavantage.co/support/#api-key
# For this demo, we'll use a fallback approach if we don't have a key
ALPHA_VANTAGE_API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "demo")

# Static stock data for fallback
FALLBACK_STOCKS = {
    "AAPL": {"name": "Apple Inc.", "price": 180.75, "change": 1.35},
    "MSFT": {"name": "Microsoft Corporation", "price": 338.48, "change": 0.89},
    "GOOGL": {"name": "Alphabet Inc.", "price": 137.12, "change": -0.45},
    "AMZN": {"name": "Amazon.com Inc.", "price": 127.74, "change": 2.25},
    "TSLA": {"name": "Tesla Inc.", "price": 237.01, "change": -1.20},
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
    
    try:
        # Try to get data from Alpha Vantage API
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
        logger.debug(f"Requesting data from Alpha Vantage: {url}")
        
        response = requests.get(url)
        data = response.json()
        
        # Check if we got valid data
        if "Global Quote" in data and data["Global Quote"]:
            quote = data["Global Quote"]
            logger.debug(f"Alpha Vantage response: {quote}")
            
            price = float(quote.get("05. price", 0))
            change_percent = float(quote.get("10. change percent", "0%").replace("%", ""))
            
            # Get company name from another endpoint
            name_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
            name_response = requests.get(name_url)
            name_data = name_response.json()
            company_name = name_data.get("Name", f"{symbol} Inc.")
            
            result = {
                "symbol": symbol,
                "price": price,
                "name": company_name,
                "change": change_percent
            }
            logger.info(f"Returning data from Alpha Vantage for {symbol}: {result}")
            return result
        else:
            logger.warning(f"No data from Alpha Vantage, using fallback for {symbol}")
            # If symbol exists in our fallback data
            if symbol in FALLBACK_STOCKS:
                return {
                    "symbol": symbol,
                    "price": FALLBACK_STOCKS[symbol]["price"],
                    "name": FALLBACK_STOCKS[symbol]["name"],
                    "change": FALLBACK_STOCKS[symbol]["change"]
                }
            # Generate random data for unknown symbols
            else:
                price = round(random.uniform(50, 500), 2)
                change = round(random.uniform(-3, 3), 2)
                return {
                    "symbol": symbol,
                    "price": price,
                    "name": f"{symbol} Inc.",
                    "change": change
                }
    except Exception as e:
        logger.error(f"Error in stock endpoint: {str(e)}")
        # Use fallback data
        if symbol in FALLBACK_STOCKS:
            return {
                "symbol": symbol,
                "price": FALLBACK_STOCKS[symbol]["price"],
                "name": FALLBACK_STOCKS[symbol]["name"],
                "change": FALLBACK_STOCKS[symbol]["change"]
            }
        else:
            # Generate random data for unknown symbols
            price = round(random.uniform(50, 500), 2)
            change = round(random.uniform(-3, 3), 2)
            return {
                "symbol": symbol,
                "price": price,
                "name": f"{symbol} Inc.",
                "change": change
            }

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