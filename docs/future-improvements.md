# Future Improvements

- Creation of roles for an admin dashboard, where assets and stock/crypto information can be configured, and users can be deleted. The endpoints of this admin panel would involve the implementation of a custom guard to validate that the user has the necessary permissions.

- Implementation of a [cronjob](https://docs.nestjs.com/techniques/task-scheduling) for automatic and synchronous price updates for all assets, without requiring a request to `GET /portfolios/{{portfolioId}}`. The current approach causes desynchronization between the TTL cache of each asset's price.

- Public endpoint to receive price alerts from platforms like TradingView, which allow the emission of information via Webhook for configured events. For this, IP filtering would be implemented (through a Guard), since TradingView provides the possible IPs that emit events.

- Implementation of an endpoint that allows users to edit their personal data.

- Support for multiple price providers, as fallbacks in case the primary one fails (Coingecko, Alpha Vantage, etc.).

- Having a price cache of only a few seconds for asset prices.

- Expanding the number of stocks and cryptocurrencies.

- Improvement of authentication by adding refresh token support.

- Implementation of CI/CD.

- Creation of new tables for stocks and cryptocurrencies to store additional asset information, such as sector, industry, description, among others.

- Adding support for bonds

- Create a table to store exchange rates between currencies (USD–EUR–ARS), allowing the frontend to display prices in the user’s preferred currency.

- Cache the responses of API endpoints to improve performance by reducing the number of database queries.