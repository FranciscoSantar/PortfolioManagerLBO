# Optional Tasks

## Implemented

- **Structured logging** — Pino-based structured logging is configured throughout the application.

- **Swagger documentation** — Full API documentation available at `http://localhost:8000/docs`.

- **Pagination** *(partial)* — Implemented on `GET /portfolios/`.

- **Advanced filters** *(partial)* — Implemented on `GET /portfolios/{portfolioId}/transactions/` and `GET /portfolios/{portfolioId}`.

## Not Implemented

The following optional tasks were not completed due to time constraints:

- **Unit and integration tests**: For unit testing, I would choose `Jest`, since I have experience with it. I would mainly focus on developing unit tests for the services that contain the most complex business logic, such as `PortfolioAssetsService` and `TransactionsService`.

- **Deployment to a platform**
