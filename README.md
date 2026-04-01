# LBO Portfolio Manager

## Summary

REST API that allows users to manage investment portfolios by creating portfolios, recording BUY/SELL transactions, tracking asset positions, and generating excel documents (`.xlsx`) with portfolios' performance reports. Asset prices are fetched in real time from Yahoo Finance and cached in Redis to avoid redundant requests. 

The API is documented with Swagger and available at `http://localhost:8000/docs` once the server is running.

## Documentation

- [Database](docs/database.md)
- Future Improvements: [EN](docs/future-improvements.md) | [ES](docs/future-improvements-es.md)
- Technical Decisions: [EN](docs/technical-decisions.md) | [ES](docs/technical-decisions-es.md)
- Optional Tasks: [EN](docs/optional-tasks.md) | [ES](docs/optional-tasks-es.md)


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


## Requirements

### Without Docker

- [Node.js](https://nodejs.org/) >= 22
- [PostgreSQL](https://www.postgresql.org/) == 15 (running locally)
- [Redis](https://redis.io/) == 7 (running locally)

### With Docker

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install)


## Supported Assets

All assets and asset types supported by the API are defined in a single configuration file: [src/seed/data/assets-types-and-assets.ts](src/seed/data/assets-types-and-assets.ts).

The file contains:
- **Asset types** — `STOCK`, `CRYPTO` (e.g. adding `BOND` in the future only requires adding it here)
- **50 stocks** 
- **15 cryptocurrencies**

This is the single source of truth for supported assets. To add a new asset type (e.g. bonds) or new tickers in the future, only this file needs to be updated before re-running the seed. 

Make sure that new assets exist in Yahoo Finance first.


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

**Note:** when running with Docker, set `DB_HOST=postgres` and `CACHE_HOST=redis` to match the service names defined in `docker-compose.yml`. Running locally should use `localhost` for both.

#### Environment Variables Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `APP_PORT` | No | Port the API will listen on. Defaults to `8000`. | `8000` |
| `IS_PROD` | No | Set to `true` to enable production mode (stricter logging, etc.). Defaults to `false`. | `false` |
| `JWT_SECRET` | **Yes** | Secret key used to sign and verify JWT tokens. Use a long, random string. | `my-super-secret-key` |
| `JWT_EXPIRES_IN` | No | JWT token expiry duration. Defaults to `1h`. Accepts values like `1h`, `7d`, `30m`. | `1h` |
| `DB_USER` | **Yes** | PostgreSQL username. | `admin` |
| `DB_PASSWORD` | **Yes** | PostgreSQL password. | `admin` |
| `DB_NAME` | **Yes** | PostgreSQL database name. | `LBOPortfolioManager` |
| `DB_PORT` | No | PostgreSQL port. Defaults to `5432`. | `5432` |
| `DB_HOST` | No | PostgreSQL host. Use `postgres` with Docker, `localhost` without. Defaults to `postgres`. | `postgres` |
| `CACHE_HOST` | No | Redis host. Use `redis` with Docker, `localhost` without. Defaults to `redis`. | `redis` |
| `CACHE_PORT` | No | Redis port. Defaults to `6379`. | `6379` |

### Step 3 — Build and start all services

```bash
docker compose up --build -d
```

> #### Without Docker
> 
> ##### Step 3.b — Install dependencies
> 
> ```bash
> yarn install
> ```
> 
> ##### Step 4.b — Start the server
> 
> ```bash
> # Development mode (watch)
> yarn start:dev
> 
> # Production mode
> yarn build && yarn start:prod
> ```
> 

### Step 4 — Run database migrations

Before seeding, apply the migrations to create all tables:

```bash
docker exec -it portfolioapi yarn migration:run
```

> Note: when running without Docker:
> ```bash
> yarn migration:run
> ```

### Step 5 — Seed the database

Run the seed script to populate asset types and all supported assets:

```bash
docker exec -it portfolioapi yarn seed:prod
```

> Note: when running without Docker:
> ```bash
> yarn seed:prod
> ```

### Step 6 — Create a user and get a token

```bash
curl -X POST http://localhost:8000/v1/api/auth/register \
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

### Step 7 — Explore the API

Interactive Swagger docs allow you to test all endpoints and generate reports of your portfolio. Access at:

```
http://localhost:8000/docs
```

### Step 8 — Stopping the application

- Without Docker: `Ctrl + C` in the terminal where the server is running.
- With Docker: `docker compose down` in the console.



## Migrations

This project uses [TypeORM migrations](https://typeorm.io/migrations) to manage database schema changes. Migrations are generated from entity definitions and must be run explicitly.

### Generate a new migration

After modifying any entity, build the project and generate a migration:

```bash
yarn build && yarn migration:generate src/migrations/<MigrationName>
```

This compares the current database schema against the entities and generates a timestamped migration file under `src/migrations/`.


# Author

[Francisco Santarelli](https://www.linkedin.com/in/francisco-santarelli/)