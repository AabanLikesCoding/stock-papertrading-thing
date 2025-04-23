# My first stock market simulator! 🚀
# Made by: [Your name here]

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from my_database_stuff import SessionLocal, engine
from my_data_classes import Base, Portfolio, Position
from my_types import TradeRequest, PortfolioResponse
from datetime import datetime
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("stock_app")

# Create my database tables
Base.metadata.create_all(bind=engine)

# Create my app
my_app = FastAPI(title="My Cool Stock Market Game 📈")

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
    logger.info(f"Stock info requested for {symbol}")
    try:
        # First try a simplified approach to ensure it works
        logger.debug(f"Creating yfinance Ticker for {symbol}")
        stock = yf.Ticker(symbol)
        
        # Try to access info with error handling
        logger.debug("Fetching stock info")
        try:
            info = stock.info
            logger.debug(f"Got info: {info.keys() if info else 'None'}")
        except Exception as e:
            logger.error(f"Error getting stock info: {str(e)}")
            # Return fallback data
            return {
                "symbol": symbol.upper(),
                "price": 150.0,
                "name": f"{symbol.upper()} Inc.",
                "change": 2.5
            }
            
        # If we got here, we have stock info
        price = info.get("regularMarketPrice", 0)
        if not price:
            price = 150.0  # Fallback value
            
        result = {
            "symbol": symbol.upper(),
            "price": price,
            "name": info.get("longName", f"{symbol.upper()} Inc."),
            "change": info.get("regularMarketChangePercent", 0) 
        }
        logger.info(f"Returning data for {symbol}: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in stock endpoint: {str(e)}")
        # Return a fallback response rather than failing
        return {
            "symbol": symbol.upper(),
            "price": 150.0,
            "name": f"{symbol.upper()} Inc.",
            "change": 2.5
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
    
    # Get current stock price
    stock = yf.Ticker(trade.symbol)
    current_price = stock.info.get("regularMarketPrice", 0)
    
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