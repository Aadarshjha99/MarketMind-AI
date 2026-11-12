
from services.sentiment_analyzer import (
    analyze_sentiment,
    analyze_articles
)


# Test 1: Individual headline
print("\n--- Individual Sentiment Test ---")

result = analyze_sentiment(
    "TCS reports strong quarterly earnings "
    "and revenue growth."
)

print(result)


# Test 2: Multiple financial headlines
print("\n--- Batch Sentiment Test ---")

articles = [
    {
        "title": "TCS reports strong quarterly earnings",
        "description": "Revenue and profits increased significantly."
    },
    {
        "title": "IT stocks fall amid global market sell-off",
        "description": "Investors react to declining technology stocks."
    },
    {
        "title": "RBI announces new monetary policy",
        "description": "The central bank releases its latest policy statement."
    }
]

results = analyze_articles(articles)

for index, result in enumerate(results, start=1):
    print(f"\nArticle {index}")
    print("Title:", result["title"])
    print("Sentiment:", result["sentiment"])
    print("Confidence:", result["sentimentScore"])
    print("Scores:", result["scores"])
