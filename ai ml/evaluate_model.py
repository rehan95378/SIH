"""Evaluate a saved NER model against the held-out synthetic examples."""

import json
from pathlib import Path


BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "models" / "ner"
DATA_PATH = BASE_DIR / "training_data" / "ner_test_unseen.json"


def evaluate() -> dict:
    try:
        import spacy
    except ImportError as error:
        raise RuntimeError("Install requirements.txt before evaluating.") from error
    if not MODEL_PATH.exists():
        raise FileNotFoundError("No trained model found. Run train_model.py first.")

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    nlp = spacy.load(MODEL_PATH)
    correct = predicted = expected = 0
    for item in data:
        actual = {(span.text, span.label_) for span in nlp(item["text"]).ents}
        target = {(entity["text"], entity["label"]) for entity in item["entities"]}
        correct += len(actual & target)
        predicted += len(actual)
        expected += len(target)
    precision = correct / predicted if predicted else 0
    recall = correct / expected if expected else 0
    f1 = (2 * precision * recall / (precision + recall)) if precision + recall else 0
    return {"precision": precision, "recall": recall, "f1": f1, "examples": len(data)}


if __name__ == "__main__":
    print(json.dumps(evaluate(), indent=2))
