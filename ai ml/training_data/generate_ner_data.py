"""Generate rich, safe synthetic investigation data for demonstrations."""

import csv
import json
import random
import re
from io import StringIO
from pathlib import Path


PEOPLE = [
    "Amit Sharma", "Ravi Mehta", "Neha Kapoor", "Arjun Nair",
    "Priya Shah", "Vikram Rao", "Sana Khan", "Karan Iyer",
    "Maya Sen", "Kabir Joshi", "Tara Desai", "Ishaan Verma",
]
LOCATIONS = [
    "Central Warehouse", "North Market", "River Road", "City Station",
    "Old Harbor", "Green Park", "Sector 18 Office", "East Port Terminal",
    "Lakeside Hotel", "Hillview Junction", "Civic Center", "West Freight Yard",
]
ORGANIZATIONS = [
    "Blue River Logistics", "Silver Star Industries", "Metro Trade Company",
    "North Gate Corporation", "Red Maple Exports", "Harbor Line Services",
]
PHONES = [f"+91 90000 {10000 + index:05d}" for index in range(1, 31)]
VEHICLES = ["MH12AB1234", "DL8CAF5678", "KA01MN2468", "GJ05XY1357", "TN09QR8642"]
ACCOUNTS = [f"AC-{1000 + index}" for index in range(1, 31)]
EMAILS = [f"contact{index}@example-test" for index in range(1, 31)]
DATES = [f"2026-08-{index:02d}" for index in range(10, 29)]
TEMPLATES = [
    "On {date}, {person_a} met {person_b} near {location}. The contact used phone {phone} and vehicle {vehicle}.",
    "An email from {email} linked {person_a} to {organization}. The message referenced {location} on {date}.",
    "Investigators matched {phone} and vehicle {vehicle} to {person_a}. The record placed the vehicle near {location}.",
    "{person_a} transferred funds from {account_a} to {account_b} for {organization} on {date}. The note mentioned {location}.",
    "The report links {person_a}, {person_b}, and {organization}. They exchanged calls near {location} using {phone}.",
]


def _entity(text, value, label):
    start = text.find(value)
    if start < 0:
        raise ValueError(f"Generated entity was not found: {value}")
    return {"text": value, "label": label, "_start": start}


def generate_examples(count=10000, seed=42):
    """Create varied NER examples with deterministic fake values."""
    generator = random.Random(seed)
    examples = []
    labels = {
        "person_a": "PERSON", "person_b": "PERSON", "location": "LOCATION",
        "organization": "ORGANIZATION", "phone": "PHONE", "vehicle": "VEHICLE",
        "account_a": "ACCOUNT", "account_b": "ACCOUNT", "email": "EMAIL",
        "date": "DATE",
    }
    for _ in range(count):
        values = {
            "person_a": generator.choice(PEOPLE),
            "person_b": generator.choice(PEOPLE),
            "location": generator.choice(LOCATIONS),
            "organization": generator.choice(ORGANIZATIONS),
            "phone": generator.choice(PHONES),
            "vehicle": generator.choice(VEHICLES),
            "account_a": generator.choice(ACCOUNTS),
            "account_b": generator.choice(ACCOUNTS),
            "email": generator.choice(EMAILS),
            "date": generator.choice(DATES),
        }
        if values["person_a"] == values["person_b"]:
            values["person_b"] = PEOPLE[(PEOPLE.index(values["person_a"]) + 1) % len(PEOPLE)]
        if values["account_a"] == values["account_b"]:
            values["account_b"] = ACCOUNTS[(ACCOUNTS.index(values["account_a"]) + 1) % len(ACCOUNTS)]
        template = generator.choice(TEMPLATES)
        text = re.sub(r"([,.])", r" \1 ", template.format(**values))
        text = re.sub(r"\s+", " ", text).strip()
        entities = []
        search_start = 0
        for key, label in labels.items():
            if "{" + key + "}" not in template:
                continue
            start = text.find(values[key], search_start)
            if start < 0:
                start = text.find(values[key])
            if start < 0:
                raise ValueError(f"Generated entity was not found: {values[key]}")
            entities.append({
                "text": values[key],
                "label": label,
                "_start": start,
            })
            search_start = start + len(values[key])
        entities.sort(key=lambda entity: entity["_start"])
        examples.append({
            "text": text,
            "entities": [
                {
                    "text": entity["text"],
                    "label": entity["label"],
                    "start": entity["_start"],
                    "end": entity["_start"] + len(entity["text"]),
                }
                for entity in entities
            ],
        })
    return examples


def _write_evidence_files(output_dir: Path, count=1000, seed=42):
    """Create fake CDR, financial, and social evidence for the demo."""
    generator = random.Random(seed)
    cdr = StringIO()
    writer = csv.DictWriter(cdr, fieldnames=["caller", "receiver", "timestamp", "duration_seconds"])
    writer.writeheader()
    for index in range(count):
        writer.writerow({
            "caller": generator.choice(PHONES),
            "receiver": generator.choice(PHONES),
            "timestamp": f"2026-08-{10 + index % 19:02d}T{index % 24:02d}:15:00Z",
            "duration_seconds": generator.randint(15, 900),
        })
    (output_dir / "fake_cdr.csv").write_text(cdr.getvalue(), encoding="utf-8")

    finance = StringIO()
    writer = csv.DictWriter(
        finance,
        fieldnames=["from_account", "to_account", "amount", "currency", "timestamp", "description"],
    )
    writer.writeheader()
    for index in range(count):
        writer.writerow({
            "from_account": generator.choice(ACCOUNTS),
            "to_account": generator.choice(ACCOUNTS),
            "amount": generator.randint(250, 250000),
            "currency": "INR",
            "timestamp": f"2026-08-{10 + index % 19:02d}",
            "description": generator.choice(["invoice", "consulting", "equipment", "freight"]),
        })
    (output_dir / "fake_financial_transactions.csv").write_text(finance.getvalue(), encoding="utf-8")

    social = StringIO()
    writer = csv.DictWriter(social, fieldnames=["source", "target", "platform", "timestamp"])
    writer.writeheader()
    for index in range(count):
        writer.writerow({
            "source": generator.choice(PEOPLE),
            "target": generator.choice(PEOPLE),
            "platform": generator.choice(["Signal", "Telegram", "Email", "Forum"]),
            "timestamp": f"2026-08-{10 + index % 19:02d}T12:00:00Z",
        })
    (output_dir / "fake_social_connections.csv").write_text(social.getvalue(), encoding="utf-8")


if __name__ == "__main__":
    output_dir = Path(__file__).parent
    output_path = output_dir / "ner_examples_large.json"
    examples = generate_examples()
    output_path.write_text(json.dumps(examples, indent=2) + "\n", encoding="utf-8")
    _write_evidence_files(output_dir)
    print(f"Generated {len(examples)} NER examples and 1000 rows per evidence file")
