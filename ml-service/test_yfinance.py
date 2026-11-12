
import yfinance as yf

symbol = "TCS.NS"

print(f"Downloading historical data for {symbol}...")

df = yf.download(
    symbol,
    period="max",
    interval="1d",
    auto_adjust=False,
    progress=True,
    multi_level_index=False
)

if df.empty:
    print("No data received.")
else:
    print("\nDownload successful!")
    print("Total candles:", len(df))
    print("First date:", df.index.min())
    print("Latest date:", df.index.max())

    print("\nColumns:")
    print(df.columns.tolist())

    print("\nLatest 5 records:")
    print(df.tail())
