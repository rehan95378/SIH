"""Train the optional NER model from the synthetic JSON examples.

Run from this folder after installing requirements:
    python train_model.py
"""

import json
import os
import random
from pathlib import Path


BASE_DIR = Path(__file__).parent
TRAIN_PATH = BASE_DIR / "training_data" / "ner_train.json"
VALIDATION_PATH = BASE_DIR / "training_data" / "ner_validation.json"
MODEL_PATH = BASE_DIR / "models" / "ner"


def train() -> None:
    try:
        import spacy
        from spacy.training import Example
    except ImportError as error:
        raise RuntimeError(
            "Model training requires spaCy. Install requirements.txt first."
        ) from error

    train_data = json.loads(TRAIN_PATH.read_text(encoding="utf-8"))
    validation_data = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))
    nlp = spacy.blank("en")
    ner = nlp.add_pipe("ner")
    labels = {entity["label"] for item in train_data for entity in item["entities"]}
    for label in labels:
        ner.add_label(label)

    def make_examples(items):
        examples = []
        for item in items:
            doc = nlp.make_doc(item["text"])
            spans = []
            for entity in item["entities"]:
                start = entity.get("start")
                end = entity.get("end")
                if not isinstance(start, int) or not isinstance(end, int):
                    raise ValueError(f"Entity offsets are missing: {entity}")
                if item["text"][start:end] != entity["text"]:
                    raise ValueError(f"Entity offsets are incorrect: {entity}")
                span = doc.char_span(start, end, entity["label"], alignment_mode="strict")
                if span is None:
                    raise ValueError(
                        f"Entity is not aligned to tokens: {entity} in {item['text']}"
                    )
                spans.append((span.start_char, span.end_char, entity["label"]))
            examples.append(
                Example.from_dict(doc, {"entities": spans})
            )
        return examples

    examples = make_examples(train_data)
    validation_examples = make_examples(validation_data)

    optimizer = nlp.initialize(get_examples=lambda: examples)
    iterations = int(os.getenv("TRAIN_ITERATIONS", "20"))
    for iteration in range(iterations):
        losses = {}
        batches = spacy.util.minibatch(examples, size=8)
        for batch in batches:
            nlp.update(batch, sgd=optimizer, drop=0.15, losses=losses)
        if iteration == 0 or (iteration + 1) % 5 == 0 or iteration + 1 == iterations:
            print(f"iteration={iteration + 1} losses={losses}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    nlp.to_disk(MODEL_PATH)

    correct = predicted = expected = 0
    for example in validation_examples:
        predicted_spans = {(span.start_char, span.end_char, span.label_) for span in nlp(example.text).ents}
        expected_spans = {
            (span.start_char, span.end_char, span.label_)
            for span in example.reference.ents
        }
        correct += len(predicted_spans & expected_spans)
        predicted += len(predicted_spans)
        expected += len(expected_spans)
    precision = correct / predicted if predicted else 0
    recall = correct / expected if expected else 0
    f1 = (2 * precision * recall / (precision + recall)) if precision + recall else 0
    print(f"validation precision={precision:.3f} recall={recall:.3f} f1={f1:.3f}")

    print(f"saved trained model to {MODEL_PATH}")


if __name__ == "__main__":
    train()
