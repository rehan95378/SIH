"""Small sample inputs for testing the AI/ML service locally."""

SAMPLE_REPORT = {
    "document_id": "seed-report-1",
    "content": (
        "Amit contacted Ravi near Central Warehouse using phone number "
        "+91 98765 43210. Blue River Logistics received vehicle MH12AB1234."
    ),
}

SAMPLE_CDR = """caller,receiver,timestamp,duration
+91 98765 43210,+91 91234 56789,2026-09-08T10:00:00Z,120
+91 91234 56789,+91 99887 66554,2026-09-08T11:30:00Z,60
"""

SAMPLE_FINANCIAL_TRANSACTIONS = """from_account,to_account,amount,currency,description
A-100,B-200,1500,INR,Warehouse payment
B-200,C-300,500,INR,Service payment
"""

SAMPLE_SOCIAL_CONNECTIONS = """source,target,platform,timestamp
Amit,Ravi,Signal,2026-09-08T10:00:00Z
Ravi,Neha,Telegram,2026-09-08T11:00:00Z
"""


def generate_demo_reports(count: int = 48):
    """Create a connected, repeatable demo corpus for graph visualization."""
    if count < 40 or count > 80:
        raise ValueError("demo report count must be between 40 and 80")
    people = ("Amit", "Ravi", "Neha", "Vikram")
    organisations = ("Blue River Logistics", "North Star Traders")
    locations = ("Central Warehouse", "Old Delhi")
    return [
        {
            "document_id": f"demo-report-{index + 1:03d}",
            "content": (
                f"{people[index % len(people)]} met {people[(index + 1) % len(people)]} "
                f"near {locations[index % len(locations)]} and contacted "
                f"{organisations[index % len(organisations)]}."
            ),
        }
        for index in range(count)
    ]
