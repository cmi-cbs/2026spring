#!/usr/bin/env python3
"""
Fetch daily closing prices for all portfolio tickers using yfinance.
Run by GitHub Action daily after market close.
"""

import json
from datetime import datetime, date
from pathlib import Path

import yfinance as yf


def main():
    # Paths
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "public" / "data"
    portfolios_path = data_dir / "portfolios.json"
    prices_path = data_dir / "prices.json"

    # Load portfolio config to get all tickers
    with open(portfolios_path) as f:
        portfolios = json.load(f)

    # Collect unique tickers from all sections
    tickers = set()
    for section in portfolios["sections"]:
        for holding in section["holdings"]:
            tickers.add(holding["ticker"])

    # Always include SPY for S&P 500 benchmark
    tickers.add("SPY")

    if not tickers:
        print("No tickers found in portfolios.json")
        return

    print(f"Fetching prices for {len(tickers)} tickers: {sorted(tickers)}")

    # Load existing prices (or create new)
    if prices_path.exists():
        with open(prices_path) as f:
            price_data = json.load(f)
    else:
        price_data = {"lastUpdated": None, "prices": {}}

    # Get today's date
    today = date.today().isoformat()

    # Skip if we already have today's data
    if today in price_data["prices"]:
        print(f"Already have prices for {today}, skipping.")
        return

    # Fetch prices using yfinance
    # Download last 5 days to handle weekends/holidays
    try:
        data = yf.download(
            list(tickers),
            period="5d",
            progress=False,
            auto_adjust=True  # Adjusts for splits and dividends
        )
    except Exception as e:
        print(f"Error fetching data: {e}")
        return

    if data.empty:
        print("No data returned from yfinance")
        return

    # Get the Close prices
    if "Close" in data.columns:
        closes = data["Close"]
    else:
        # Single ticker case
        closes = data[["Close"]]
        closes.columns = [list(tickers)[0]]

    # Process each trading day we got
    for idx in closes.index:
        date_str = idx.strftime("%Y-%m-%d")

        if date_str in price_data["prices"]:
            continue  # Already have this date

        day_prices = {}
        for ticker in tickers:
            try:
                price = closes.loc[idx, ticker]
                if not pd.isna(price):
                    day_prices[ticker] = round(float(price), 2)
            except (KeyError, TypeError):
                pass  # Ticker not in data or NaN

        if day_prices:
            price_data["prices"][date_str] = day_prices
            print(f"Added prices for {date_str}: {len(day_prices)} tickers")

    # Update timestamp
    price_data["lastUpdated"] = datetime.utcnow().isoformat() + "Z"

    # Save
    with open(prices_path, "w") as f:
        json.dump(price_data, f, indent=2, sort_keys=True)

    print(f"Prices saved to {prices_path}")


if __name__ == "__main__":
    import pandas as pd  # Import here to allow script to show error if missing
    main()
