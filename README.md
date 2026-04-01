# LBO Portfolio Manager

## Summary

REST API that allows users to manage investment portfolios by creating portfolios, recording BUY/SELL transactions, tracking asset positions, and generating excel documents (`.xlsx`) with portfolios' performance reports. Asset prices are fetched in real time from Yahoo Finance and cached in Redis to avoid redundant requests. 

The API is documented with Swagger and available at `http://localhost:8000/docs` once the server is running.

## Documentation

- [Database](docs/database.md)
- Future Improvements: [EN](docs/future-improvements.md) | [ES](docs/future-improvements-es.md)
- Technical Decisions: [EN](docs/technical-decisions.md) | [ES](docs/technical-decisions-es.md)

---

## Technologies Used

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) (Node.js / TypeScript) |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT + bcrypt |
| Market Data | yahoo-finance2 |
| Logging | Pino |
| Docs | Swagger / OpenAPI |
| Containerization | Docker + Docker Compose |

---

## Requirements

### Without Docker

- [Node.js](https://nodejs.org/) >= 22
- [PostgreSQL](https://www.postgresql.org/) >= 15 (running locally)
- [Redis](https://redis.io/) >= 7 (running locally)

### With Docker

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install)

---

## Running the Application

### Step 1 — Clone the repository

```bash
git clone https://github.com/FranciscoSantar/PortfolioManagerLBO.git

cd PortfolioManagerLBO
```

### Step 2 — Set up environment variables

```bash
cp .env.example .env
```

Open the `.env` file and fill in the required values (database credentials, JWT secret, etc.).

> **Note:** when running with Docker, set `DB_HOST=postgres` and `CACHE_HOST=redis` to match the service names defined in `docker-compose.yml`. Running locally should use `localhost` for both.

---

### Without Docker

#### Step 3 — Install dependencies

```bash
yarn install
```

#### Step 4 — Start the server

```bash
# Development mode (watch)
yarn start:dev

# Production mode
yarn build && yarn start:prod
```

---

### With Docker

#### Step 3 — Build and start all services

```bash
docker compose up --build -d
```

---

## Supported Assets

All assets and asset types supported by the API are defined in a single configuration file: [src/seed/data/assets-types-and-assets.ts](src/seed/data/assets-types-and-assets.ts).

The file contains:
- **Asset types** — `STOCK`, `CRYPTO` (e.g. adding `BOND` in the future only requires adding it here)
- **50 stocks** 
- **15 cryptocurrencies**

This is the single source of truth for supported assets. To add a new asset type (e.g. bonds) or new tickers in the future, only this file needs to be updated before re-running the seed. 

Make sure that new assets exist in Yahoo Finance first.

---

## Getting Started

### 1. Seed the database

Run the seed script to populate asset types and all supported assets:

```bash
yarn seed
```

> Note: when running with Docker, exec into the container first:
> ```bash
> docker exec -it portfolioapi yarn seed:prod
> ```

### 2. Create a user and get a token

```bash
curl -X POST http://localhost:8000/v1/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "Password123"
  }'
```

The response will include a `token`. Use it as a Bearer token in subsequent requests:

```bash
curl http://localhost:8000/v1/api/portfolios \
  -H "Authorization: Bearer <your_token>"
```

### 4. Explore the API

Interactive Swagger docs are available at:

```
http://localhost:8000/docs
```

---

## Key Concepts

### Adding assets to a portfolio

Assets are not added directly to a portfolio. Instead, posting a **BUY** transaction for a given asset is what creates the position in the portfolio. The portfolio asset (position) is created automatically when the first BUY transaction is recorded.

Similarly, a **SELL** transaction reduces the position. If the full quantity is sold, the position is removed from the portfolio.