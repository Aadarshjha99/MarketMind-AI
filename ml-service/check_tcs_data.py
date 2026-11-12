
import yfinance as yf

SYMBOL = "TCS.NS"

df = yf.download(
    SYMBOL,
    start="2004-05-01",
    end="2005-08-05",
    interval="1d",
    auto_adjust=False,
    progress=False,
    multi_level_index=False
)

print("\n========== ORIGINAL YAHOO DATA ==========")

dates_to_check = [
    "2004-05-05",
    "2004-05-06",
    "2004-07-27",
    "2004-07-28",
    "2005-07-26",
    "2005-07-27",
    "2005-07-28",
    "2005-07-29",
]

for date in dates_to_check:
    if date in df.index.strftime("%Y-%m-%d"):
        print(f"\n{date}")
        print(df.loc[date])

print("\n========== ADJUSTMENT COMPARISON ==========")

df["adjustment_ratio"] = df["Adj Close"] / df["Close"]

print(
    df.loc[
        "2004-05-01":"2004-05-20",
        ["Close", "Adj Close", "adjustment_ratio", "Volume"]
    ]
)

print(
    df.loc[
        "2005-07-20":"2005-08-05",
        ["Close", "Adj Close", "adjustment_ratio", "Volume"]
    ]
)
