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
