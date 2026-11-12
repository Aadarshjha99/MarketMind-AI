
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "ProsusAI/finbert"

print("Loading FinBERT tokenizer...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

print("Loading FinBERT model...")

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME
)

model.eval()

print("FinBERT loaded successfully!")

text = "TCS reports strong quarterly earnings and revenue growth."

inputs = tokenizer(
    text,
    return_tensors="pt",
    truncation=True,
    max_length=512
)

with torch.no_grad():
    outputs = model(**inputs)

probabilities = torch.softmax(outputs.logits, dim=1)[0]

labels = model.config.id2label

for index, probability in enumerate(probabilities):
    print(
        labels[index],
        round(probability.item(), 4)
    )
