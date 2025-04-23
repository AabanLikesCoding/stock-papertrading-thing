# Stock Market Simulator

A professional-grade stock market simulator built with Next.js and FastAPI. Practice trading with virtual capital and real-time market data.

## Features

- Real-time stock price tracking
- Portfolio management
- Trade execution (buy/sell)
- Trading history
- Price alerts
- Market overview
- Clean, modern UI with animations

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- React Hooks
- Real-time data fetching

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- yfinance (Yahoo Finance API)
- Python 3.8+

## Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- pip
- npm or yarn

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a .env.local file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a .env file:
```bash
DATABASE_URL=sqlite:///my_stock_game.db
```

5. Run the server:
```bash
uvicorn main:app --reload
```

## Project Structure

```
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── MarketOverview.tsx
│   │   │   ├── PriceAlert.tsx
│   │   │   └── SearchHistory.tsx
│   │   ├── history/
│   │   ├── portfolio/
│   │   ├── trade/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── package.json
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
└── README.md
```

## Development

The application uses:
- Tailwind CSS for styling
- TypeScript for type safety
- FastAPI for backend API
- SQLAlchemy for database ORM
- yfinance for real-time stock data

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Configure environment variables
4. Deploy

### Backend
1. Set up a Python hosting service (e.g., Heroku, DigitalOcean)
2. Configure environment variables
3. Deploy the FastAPI application

## License

MIT License - feel free to use this project for learning purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request 