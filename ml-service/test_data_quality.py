
import yfinance as yf
import pandas as pd

df = yf.download(
    "TCS.NS",
    period="max",
    interval="1d",
    auto_adjust=True,
    progress=False,
    multi_level_index=False
)

print("========== DATASET SUMMARY ==========")
print("Total rows:", len(df))
print("Start date:", df.index.min())
print("End date:", df.index.max())

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())

print("\n========== DUPLICATE DATES ==========")
print("Duplicates:", df.index.duplicated().sum())

print("\n========== PRICE VALIDATION ==========")
print("Zero or negative prices:")
print((df[["Open", "High", "Low", "Close"]] <= 0).sum())

print("\n========== VOLUME VALIDATION ==========")
print("Negative volume:", (df["Volume"] < 0).sum())

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== LATEST RECORDS ==========")
print(df.tail())
