
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification
)

MODEL_NAME = "ProsusAI/finbert"

# Use CPU initially to keep the setup simple.
DEVICE = torch.device("cpu")

# Avoid excessive CPU thread usage.
torch.set_num_threads(2)

_tokenizer = None
_model = None


def load_sentiment_model():
    """
    Load FinBERT once and reuse it for subsequent predictions.
    """
    global _tokenizer, _model

    if _tokenizer is None or _model is None:
        print("Loading FinBERT sentiment model...")

        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

        _model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_NAME
        )

        _model.to(DEVICE)
        _model.eval()

        print("FinBERT loaded successfully.")

    return _tokenizer, _model


def analyze_sentiment(text):
    """
    Analyze one financial news article.

    Returns:
        sentiment: positive, negative, or neutral
        sentimentScore: confidence of the predicted class
        scores: probabilities for all three classes
    """

    if not isinstance(text, str) or not text.strip():
        raise ValueError("Text cannot be empty.")

    tokenizer, model = load_sentiment_model()

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True
    )

    inputs = {
        key: value.to(DEVICE)
        for key, value in inputs.items()
    }

    with torch.no_grad():
        outputs = model(**inputs)

    probabilities = torch.softmax(
        outputs.logits,
        dim=1
    )[0]

    labels = model.config.id2label

    scores = {
        str(labels[index]).lower(): round(
            probabilities[index].item(), 4
        )
        for index in range(len(probabilities))
    }

    predicted_index = torch.argmax(probabilities).item()

    sentiment = str(
        labels[predicted_index]
    ).lower()

    confidence = probabilities[predicted_index].item()

    return {
        "sentiment": sentiment,
        "sentimentScore": round(confidence, 4),
        "scores": scores
    }


def analyze_articles(articles):
    """
    Analyze multiple news articles.

    Each article should contain title and description.
    """

    if not isinstance(articles, list):
        raise ValueError("Articles must be provided as a list.")

    results = []

    for article in articles:
        if not isinstance(article, dict):
            continue

        title = article.get("title", "")
        description = article.get("description", "")

        text = f"{title}. {description}".strip()

        if not text or text == ".":
            continue

        result = analyze_sentiment(text)

        results.append({
            "url": article.get("url"),
            "title": title,
            **result
        })

    return results
