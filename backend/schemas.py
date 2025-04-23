from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class PositionBase(BaseModel):
    symbol: str
    quantity: float
    average_price: float

class PositionResponse(BaseModel):
    symbol: str
    quantity: float
    averagePrice: float
    currentPrice: float
    totalValue: float
    profitLoss: float

class Position(PositionBase):
    id: int
    portfolio_id: int

    class Config:
        from_attributes = True

class TradeBase(BaseModel):
    symbol: str
    quantity: float
    action: str  # "buy" or "sell"

class TradeRequest(TradeBase):
    user_id: int

class TradeResponse(BaseModel):
    message: str
    new_balance: float

class Trade(TradeBase):
    id: int
    portfolio_id: int
    price: float
    timestamp: datetime

    class Config:
        from_attributes = True

class PortfolioResponse(BaseModel):
    cash: float
    positions: List[PositionResponse]

class StockPrice(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    changePercent: float

class TradeHistoryResponse(BaseModel):
    id: int
    symbol: str
    action: str
    quantity: float
    price: float
    total: float
    timestamp: datetime 