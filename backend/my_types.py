# These are like templates for our data! 🏗️
from pydantic import BaseModel
from typing import List
from datetime import datetime

# User stuff
class NewUser(BaseModel):
    username: str    # What they want to be called
    email: str      # Their email
    password: str   # Their secret password

class User(BaseModel):
    id: int
    username: str
    email: str
    
    class Config:
        from_attributes = True

# Stock stuff
class StockPosition(BaseModel):
    symbol: str           # Like AAPL for Apple
    quantity: float       # How many shares
    average_price: float  # Average price paid per share

    class Config:
        from_attributes = True

# Trading stuff
class TradeRequest(BaseModel):
    symbol: str      # What stock to trade
    quantity: float  # How many shares
    trade_type: str  # "BUY" or "SELL"
    user_id: int     # Who's making the trade

class Trade(BaseModel):
    id: int
    symbol: str
    quantity: float
    price: float
    trade_type: str
    when: datetime

    class Config:
        from_attributes = True

# Portfolio stuff
class PortfolioResponse(BaseModel):
    id: int
    user_id: int
    cash: float                     # How much money they have
    stocks: List[StockPosition] = [] # What stocks they own
    trades: List[Trade] = []        # Their trade history

    class Config:
        from_attributes = True

# Stock price info
class StockInfo(BaseModel):
    symbol: str   # Stock symbol
    price: float  # Current price
    name: str     # Company name
    change: float # Price change today 