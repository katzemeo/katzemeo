# katzemeo - deno - Alpha Vantage PoC

## Run from terminal (client)
Run the client to access the server
```
- deno run --allow-net=www.alphavantage.co:80 --allow-env --allow-read --watch querySymbol.ts
```

## API Documentation
TIME_SERIES_DAILY 
```
- https://www.alphavantage.co/documentation/#daily
- function=TIME_SERIES_DAILY, symbol=?, outputsize=compact (default for last 100 days) or full (up to 20+ years of historical!)
```
