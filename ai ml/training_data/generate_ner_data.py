"""Generate rich, safe synthetic investigation data for demonstrations."""

import csv
import json
import os
import random
import re
from io import StringIO
from pathlib import Path


PEOPLE = [
    "Amit Sharma", "Ravi Mehta", "Neha Kapoor", "Arjun Nair",
    "Priya Shah", "Vikram Rao", "Sana Khan", "Karan Iyer",
    "Maya Sen", "Kabir Joshi", "Tara Desai", "Ishaan Verma",
    "Ramesh Kumar Sharma", "Farah Siddiqui", "Devendra Malik",
    "Ananya Bose", "Imran Qureshi", "Meera Joshi", "Daniel Thomas",
    "Suresh Chandrasekar", "Nandita Mukherjee", "Harpreet Singh",
    "Lakshmi Narayanan", "Zoya Merchant", "Joseph Mathew",
]
LOCATIONS = [
    "Central Warehouse", "North Market", "River Road", "City Station",
    "Old Harbor", "Green Park", "Sector 18 Office", "East Port Terminal",
    "Lakeside Hotel", "Hillview Junction", "Civic Center", "West Freight Yard",
    "Vasant Kunj", "Dwarka Sector 12", "Bandra West", "Kochi Port",
    "Old Delhi Market", "Cyber City Gurugram", "Pune Camp",
    "Sector 21 Police Station", "Howrah Bridge", "Chennai Central",
    "Jaipur Industrial Area", "Noida Film City", "Surat Diamond Market",
]
ORGANIZATIONS = [
    "Blue River Logistics", "Silver Star Industries", "Metro Trade Company",
    "North Gate Corporation", "Red Maple Exports", "Harbor Line Services",
    "Aster Digital Services", "Kaveri Trading House", "Sunrise Finance Ltd",
]
PHONES = [f"+91 90000 {10000 + index:05d}" for index in range(1, 31)]
VEHICLES = ["MH12AB1234", "DL8CAF5678", "KA01MN2468", "GJ05XY1357", "TN09QR8642"]
ACCOUNTS = [f"AC-{1000 + index}" for index in range(1, 31)]
EMAILS = [f"contact{index}@example-test" for index in range(1, 31)]
DATES = [f"2026-08-{index:02d}" for index in range(10, 29)]
MONEY = [f"₹{amount}" for amount in [65000, 125000, 480000, 2500000, 9750]]
ITEMS = [
    "Lenovo laptop", "digital camera", "gold jewellery", "silver ornaments",
    "black smartphone", "USB drive", "forged passport", "pistol",
    "diamond necklace", "vehicle registration papers", "bank cheque book",
    "encrypted hard drive", "SIM card", "CCTV recorder",
]
LAW_SECTIONS = ["BNS Section 305", "BNS Section 331-3", "IT Act Section 66C"]
DEVICES = ["IMEI 356789012345678", "MAC address A4:5E:60:12:AB:90"]
IP_ADDRESSES = [
    "IP 203.0.113.17", "IP 198.51.100.42", "IP 192.0.2.88",
    "IP 203.0.113.201", "IP 198.51.100.109",
]
URLS = [
    "https://evidence.example.test/archive/alpha",
    "https://portal.example.test/case/ledger-17",
    "https://secure.example.test/drop/blue-river",
    "https://records.example.test/query/2026-08",
]
TIMES = ["06:45", "09:20", "13:05", "18:40", "23:15"]
HASHES = [
    "SHA256 9f86d081884c7d659a2feaa0c55ad015",
    "SHA256 5e884898da28047151d0e56f8dc62927",
    "SHA256 2bb80d537b1da3e38bd30361aa855686",
]
CRYPTO_WALLETS = [
    "wallet 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "wallet 0x52908400098527886E0F7030069857D2E4169EE7",
    "wallet 0xde709f2102306220921060314715629080e2fb77",
]
CASE_IDS = ["FIR-2026-0817", "CASE-DEL-0421", "ECIR-MH-7782", "SEIZURE-09-2026"]
ADDRESSES = [
    "14 Lotus Residency Pune",
    "Plot 22 Export Park Noida",
    "Flat 7B River Road Apartments",
    "Warehouse 4 East Port Terminal",
]
TEMPLATES = [
    "On {date}, {person_a} met {person_b} near {location}. The contact used phone {phone} and vehicle {vehicle}.",
    "An email from {email} linked {person_a} to {organization}. The message referenced {location} on {date}.",
    "Investigators matched {phone} and vehicle {vehicle} to {person_a}. The record placed the vehicle near {location}.",
    "{person_a} transferred funds from {account_a} to {account_b} for {organization} on {date}. The note mentioned {location}.",
    "The report links {person_a}, {person_b}, and {organization}. They exchanged calls near {location} using {phone}.",
    "FIR {law_section}: {person_a} reported that {item} worth {money} was stolen at {location} on {date}.",
    "{person_a} used {device} and email {email} while communicating with {person_b} near {location}.",
    "A complaint by {person_a} names {person_b} and records phone {phone}; the incident occurred at {location}.",
    "Investigators recovered {item} and {device} from {location}; the case cites {law_section}.",
    "Bank review found {money} transferred from {account_a} to {account_b} for {organization} on {date}.",
    "To the Officer In Charge, {location}. {person_a} reported that on {date}, {item} and {money} were taken from the residence. The complaint records phone {phone} and cites {law_section}.",
    "CASE NOTE: Witness {person_a} saw {person_b} near {location}. A {vehicle} was recorded on camera. Investigators linked email {email}, device {device}, and account {account_a} to the enquiry on {date}.",
    "FINANCIAL INTELLIGENCE NOTE. On {date}, {money} moved from {account_a} to {account_b}. The beneficiary was {organization}; the reference mentioned {location} and contact phone {phone}.",
    "DIGITAL EVIDENCE SUMMARY: email {email} and {device} were recovered from {location}. {person_a} identified {person_b} and described the missing {item}. The file is marked {law_section}.",
    "CASE {case_id} | {date} {time}. Witness statement: {person_a}, also known as {person_b}, visited {address}. The access log recorded {ip_address}; the seized device was {device}.",
    "At {time} on {date}, analysts downloaded {url}. The page associated {email} with {account_a}; checksum {hash_value} matched the image recovered from {location}.",
    "MONEY TRAIL: {account_a} sent {money} to {account_b}, then {account_b} moved funds to {crypto_wallet}. The transfer note named {organization}, {case_id}, and {person_a}.",
    "Chronology ({case_id}): {person_a} called {person_b} at {time}; {phone} connected through {ip_address} near {location}. A {vehicle} was visible outside {organization}.",
    "FORENSIC INVENTORY. Exhibit {case_id} contains {item}, {device}, and a file with hash {hash_value}. The material was collected at {address} on {date} at {time}.",
    "The confidential source wrote, \"{person_a} will meet {person_b} at {location} on {date}.\" Investigators linked the message to {email}, {phone}, and account {account_a}.",
    "BANK ALERT [{case_id}]: {money} was withdrawn from {account_a} at {time}, followed by a transfer to {account_b}. The merchant was {organization} at {address}.",
    "Server logs show {ip_address} requested {url} on {date} at {time}. The session used email {email} and referenced vehicle {vehicle} near {location}.",
    "In the witness narrative, {person_a} denied knowing {person_b}; however, call record {phone} and wallet {crypto_wallet} appeared in the same investigation file {case_id}.",
    "PROPERTY SEIZURE: {item} and {item_b} were recovered from {address}. The receipt names {person_a}, {organization}, and amount {money}; the seizure occurred on {date}.",
    "A cross-border alert connected {person_a} in {location} to {person_b} in {address}. Contact details were {email} and {phone}; the alert was issued at {time} under {law_section}.",
    "Digital timeline: {date} {time} - login from {ip_address}; {time} - message to {email}; {time} - transfer {money} from {account_a} to {account_b}; {time} - visit to {location}.",
    "The report cites {law_section} and {case_id}. It lists {person_a} as the complainant, {person_b} as a witness, {organization} as the employer, and {item} as the missing property.",
    "Investigators compared hash {hash_value} from {url} with the device {device} seized from {person_a} at {address}. The comparison was recorded on {date} at {time}.",
    "Network note: {ip_address} resolved during a session for {email}; the same account contacted {person_b} using {phone} and mentioned {organization} near {location}.",
    "Ledger row {case_id}: account {account_a} paid {money} to {account_b} for {item} at {time}; the approving officer was {person_a}, and the vendor was {organization}.",
    "A taxi record placed {person_a} and {person_b} near {location} at {time}. The vehicle {vehicle} was later found at {address}; phone {phone} was active on {date}.",
    "INCIDENT SUMMARY / {date}: {person_a} reported {item} missing from {address}. CCTV showed {vehicle}; email {email}, IP {ip_address}, and device {device} were preserved as exhibits.",
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
        "date": "DATE", "money": "MONEY", "item": "ITEM",
        "law_section": "LAW_SECTION", "device": "DEVICE",
        "ip_address": "IP_ADDRESS", "url": "URL", "time": "TIME",
        "hash_value": "HASH", "crypto_wallet": "CRYPTO_WALLET",
        "case_id": "CASE_ID", "address": "ADDRESS", "item_b": "ITEM",
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
            "money": generator.choice(MONEY),
            "item": generator.choice(ITEMS),
            "law_section": generator.choice(LAW_SECTIONS),
            "device": generator.choice(DEVICES),
            "ip_address": generator.choice(IP_ADDRESSES),
            "url": generator.choice(URLS),
            "time": generator.choice(TIMES),
            "hash_value": generator.choice(HASHES),
            "crypto_wallet": generator.choice(CRYPTO_WALLETS),
            "case_id": generator.choice(CASE_IDS),
            "address": generator.choice(ADDRESSES),
            "item_b": generator.choice(ITEMS),
        }
        if values["person_a"] == values["person_b"]:
            values["person_b"] = PEOPLE[(PEOPLE.index(values["person_a"]) + 1) % len(PEOPLE)]
        if values["account_a"] == values["account_b"]:
            values["account_b"] = ACCOUNTS[(ACCOUNTS.index(values["account_a"]) + 1) % len(ACCOUNTS)]
        template = generator.choice(TEMPLATES)
        # Keep dots and hyphens intact so URLs, IPs, dates, and hashes remain
        # realistic and their annotations stay token-aligned.
        text = re.sub(r"([,;()])", r" \1 ", template.format(**values))
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


def write_splits(examples, output_dir: Path, seed=42):
    """Write reproducible train, validation, and unseen test files."""
    shuffled = list(examples)
    random.Random(seed).shuffle(shuffled)
    first = int(len(shuffled) * 0.75)
    second = int(len(shuffled) * 0.875)
    for filename, rows in (
        ("ner_train.json", shuffled[:first]),
        ("ner_validation.json", shuffled[first:second]),
        ("ner_test_unseen.json", shuffled[second:]),
    ):
        (output_dir / filename).write_text(
            json.dumps(rows, indent=2) + "\n", encoding="utf-8"
        )


def _write_evidence_files(output_dir: Path, count=1000, seed=42):
    """Create fake CDR, financial, and social evidence for the demo."""
    generator = random.Random(seed)
    cdr = StringIO()
    writer = csv.DictWriter(
        cdr,
        fieldnames=["caller", "receiver", "timestamp", "duration_seconds"],
        lineterminator="\n",
    )
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
        lineterminator="\n",
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
    writer = csv.DictWriter(
        social,
        fieldnames=["source", "target", "platform", "timestamp"],
        lineterminator="\n",
    )
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
    examples = generate_examples(count=int(os.getenv("NER_EXAMPLES", "50000")))
    output_path.write_text(json.dumps(examples, indent=2) + "\n", encoding="utf-8")
    write_splits(examples, output_dir)
    evidence_count = int(os.getenv("EVIDENCE_ROWS", "5000"))
    _write_evidence_files(output_dir, count=evidence_count)
    print(f"Generated {len(examples)} NER examples and {evidence_count} rows per evidence file")
