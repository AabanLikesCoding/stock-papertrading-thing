# My first stock market simulator! 🚀
# Made by: [Your name here]

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from my_database_stuff import SessionLocal, engine
from my_data_classes import Base, Portfolio, Position
from my_types import TradeRequest, PortfolioResponse
from datetime import datetime
import os

# Create my database tables
Base.metadata.create_all(bind=engine)

# Create my app
my_app = FastAPI(title="My Cool Stock Market Game 📈")

# Get frontend URL from environment variable or use localhost for development
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# Allow my React app to talk to my backend
my_app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "*"],  # Allow requests from the frontend and any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get database connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@my_app.get("/")
def say_hello():
    return {"message": "Welcome to my stock market game! 🎮"}

@my_app.get("/stock/{symbol}")
async def get_stock_info(symbol: str):
    try:
        # Get real stock data using yfinance
        stock = yf.Ticker(symbol)
        info = stock.info
        return {
            "symbol": symbol,
            "price": info.get("regularMarketPrice", 0),
            "name": info.get("longName", ""),
            "change": info.get("regularMarketChangePercent", 0)
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Couldn't find stock {symbol} 😢")

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