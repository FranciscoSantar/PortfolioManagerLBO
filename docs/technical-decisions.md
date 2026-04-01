# Decisions Made During Development

- I decided to use a relational database system, since there are relationships between portfolios, assets, portfolio assets, and transactions that are easily represented in a relational database engine. My choice was `Postgres`, since I have prior experience with this technology.

- I opted to implement caching for storing asset prices, to avoid multiple calls to the price provider system. For this, `Redis` was the chosen option, since I had prior experience with it and I consider it the most popular option for this use case.

- I decided to create the `AssetTypes` table so that, in the future, it will be very easy to add a new asset type for users to operate with.

- At the architecture and folder structure level, I decided to follow the structure recommended by NestJS: `Module-Controller-Service`, and work with dependency injection.

- I chose `Yahoo Finance` as the asset price source, since it contains information for both stocks and cryptocurrencies, avoiding the need to work with two information sources.

- The cache time for each price is 5 minutes. This was defined to avoid exceeding a possible rate limit from Yahoo Finance.

- To add an asset (stock or cryptocurrency) to a portfolio, it is validated that a transaction of type `BUY` is made.

- 2 commission types are supported for each transaction:
  - `FIXED`: a fixed value in USD, regardless of the traded quantity.
  - `PERCENTAGE`: a value proportional to the transaction amount.

- For buy transactions, the commission value (if commission information was included) is taken into account when calculating the asset's average buy price, to achieve more realistic behavior considering the presence of commissions.

- Reports are generated in `.xlsx` format, and include the following sheets:
  - Portfolio summary.
  - Summary of each asset in the portfolio.
  - One sheet per asset; all transactions for that asset are listed there.
