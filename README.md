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
- PostgreSQL (production) / SQLite (development)
- yfinance (Yahoo Finance API)
- Python 3.9+

### Deployment
- Docker
- Render (unified deployment)
- Environment variables for configuration

## Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.9+
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
│   ├── .env.production
│   ├── next.config.js
│   └── package.json
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
├── Dockerfile
├── render.yaml
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

### Combined Deployment on Render
1. Push to GitHub
2. Import to Render
3. Set the environment variable:
   | Key | Value |
   |---|---|
   | DATABASE_URL | postgresql://postgres:password@localhost:5432/stock_simulator |
4. Deploy as a Docker service

The application is deployed as a single Docker container that runs both the FastAPI backend and serves the Next.js frontend. The frontend API calls are proxied to the backend through the `/api` route.

## License

MIT License - feel free to use this project for learning purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request 