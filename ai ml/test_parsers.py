"""Unit tests for AI/ML extraction and parsers."""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))

import unittest
from parsers.cdr_parser import parse_cdr
from parsers.financial_parser import parse_financial_transactions
from parsers.social_parser import parse_social_connections
from extract import extract_entities
from graph import analyze_graph, calculate_pagerank, calculate_betweenness


class TestParsers(unittest.TestCase):
    def test_cdr_parser_normal_and_bom_and_self_loop(self):
        csv_data = "\ufeffcaller,receiver,timestamp,duration\n+919876543210,+919876543211,2026-09-08,60\n+919876543210,+919876543210,2026-09-08,10\n"
        result = parse_cdr(csv_data, "doc-1")
        self.assertEqual(result["status"], "cdr_csv")
        self.assertEqual(len(result["entities"]), 2)
        # Self-loop row (+919876543210 to +919876543210) should be skipped
        self.assertEqual(len(result["relationships"]), 1)
        self.assertEqual(result["relationships"][0]["relationship_type"], "called")

    def test_financial_parser_normal_and_bom_and_self_loop(self):
        csv_data = "\ufefffrom_account,to_account,amount,currency\nACC-1,ACC-2,5000,INR\nACC-1,ACC-1,100,INR\n"
        result = parse_financial_transactions(csv_data, "doc-2")
        self.assertEqual(result["status"], "financial_csv")
        self.assertEqual(len(result["entities"]), 2)
        self.assertEqual(len(result["relationships"]), 1)
        self.assertEqual(result["relationships"][0]["relationship_type"], "transferred")

    def test_social_parser_normal_and_bom_and_self_loop(self):
        csv_data = "\ufeffsource,target,platform\nAmit,Ravi,Telegram\nAmit,Amit,Signal\n"
        result = parse_social_connections(csv_data, "doc-3")
        self.assertEqual(result["status"], "social_csv")
        self.assertEqual(len(result["entities"]), 2)
        self.assertEqual(len(result["relationships"]), 1)
        self.assertEqual(result["relationships"][0]["relationship_type"], "connected_to")

    def test_extract_phone_does_not_match_iso_date(self):
        text = "Meeting happened on 2026-09-08 near Warehouse. Call was made to +91 98765 43210."
        entities = extract_entities("doc-4", text)
        types = {e["name"]: e["type"] for e in entities}
        self.assertIn("2026-09-08", types)
        self.assertEqual(types["2026-09-08"], "date")
        self.assertIn("+91 98765 43210", types)
        self.assertEqual(types["+91 98765 43210"], "phone")

    def test_graph_analytics(self):
        entities = [
            {"id": "A", "type": "person", "name": "A", "confidence": 1.0},
            {"id": "B", "type": "person", "name": "B", "confidence": 1.0},
            {"id": "C", "type": "person", "name": "C", "confidence": 1.0},
        ]
        relationships = [
            {"id": "e1", "source": "A", "target": "B", "relationship_type": "met"},
            {"id": "e2", "source": "B", "target": "C", "relationship_type": "met"},
        ]
        analytics = analyze_graph(entities, relationships)
        # B is the bridge between A and C
        self.assertGreater(analytics["betweenness"]["B"], 0)
        self.assertEqual(analytics["betweenness"]["A"], 0)
        self.assertEqual(analytics["betweenness"]["C"], 0)


if __name__ == "__main__":
    unittest.main()
