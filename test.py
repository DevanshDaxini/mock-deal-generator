"""
Smoke test for Ycrest Mock Deal Generator.
Tests all 4 endpoints end-to-end with minimal config.
Expected runtime: ~30 seconds
Expected cost: $0.01-$0.02 at Haiku rates
"""

import httpx
import json
import sys

BASE_URL = "http://localhost:8000"

SMOKE_TEST_CONFIG = {
    "company_name": None,
    "industry": "Fintech",
    "deal_size": "$50k ARR",
    "sales_cycle_length_days": 14,
    "starting_sentiment": "neutral",
    "ending_sentiment": "positive",
    "deal_outcome": "closed_won",
    "champion_entry": "after_demo",
    "main_objection": "Pricing",
    "buyer_urgency": "medium",
    "num_calls": 2,
    "emails_per_stage": 1,
    "num_stakeholders": 2,
    "complexity": "simple"
}

def check(condition: bool, label: str):
    """Helper to check assertion and exit on failure."""
    if condition:
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label}")
        sys.exit(1)

def test_generate() -> str:
    """Test POST /api/generate."""
    print("\n[1/4] POST /api/generate")
    r = httpx.post(f"{BASE_URL}/api/generate", json=SMOKE_TEST_CONFIG, timeout=120.0)
    check(r.status_code == 200, f"Status code is 200 (got {r.status_code})")
    data = r.json()
    check("deal_id" in data, "Response contains deal_id")
    check("filename" in data, "Response contains filename")
    check("deal" in data, "Response contains deal object")
    check("metadata" in data["deal"], "Deal contains metadata")
    check("events" in data["deal"], "Deal contains events")
    events = data["deal"]["events"]
    check(len(events) > 0, f"Events list is not empty ({len(events)} events)")
    types = {e["record_type"] for e in events}
    check("call" in types, "At least one call event present")
    check("email" in types, "At least one email event present")
    check("crm_note" in types, "At least one crm_note event present")
    metadata = data["deal"]["metadata"]
    check("company" in metadata, "Metadata contains company profile")
    check("stakeholders" in metadata, "Metadata contains stakeholders")
    check("objections" in metadata, "Metadata contains objections list")
    check("sentiment_arc" in metadata, "Metadata contains sentiment_arc")
    check("stage_progression" in metadata, "Metadata contains stage_progression")
    print(f"        Deal ID: {data['deal_id']}")
    print(f"        File: {data['filename']}")
    print(f"        Events generated: {len(events)}")
    return data["deal_id"]

def test_list_deals(expected_deal_id: str):
    """Test GET /api/deals."""
    print("\n[2/4] GET /api/deals")
    r = httpx.get(f"{BASE_URL}/api/deals", timeout=10.0)
    check(r.status_code == 200, f"Status code is 200 (got {r.status_code})")
    data = r.json()
    check("deals" in data, "Response contains deals array")
    check(len(data["deals"]) > 0, f"Deals list is not empty ({len(data['deals'])} deals)")
    ids = [d["deal_id"] for d in data["deals"]]
    check(expected_deal_id in ids, "Generated deal appears in list")
    deal_summary = next(d for d in data["deals"] if d["deal_id"] == expected_deal_id)
    check("company_name" in deal_summary, "Deal summary contains company_name")
    check("deal_outcome" in deal_summary, "Deal summary contains deal_outcome")
    check("num_events" in deal_summary, "Deal summary contains num_events")

def test_get_deal(deal_id: str):
    """Test GET /api/deals/{deal_id}."""
    print(f"\n[3/4] GET /api/deals/{deal_id}")
    r = httpx.get(f"{BASE_URL}/api/deals/{deal_id}", timeout=10.0)
    check(r.status_code == 200, f"Status code is 200 (got {r.status_code})")
    data = r.json()
    check("deal" in data, "Response contains deal object")
    events = data["deal"]["events"]
    check(len(events) > 0, "Events loaded from disk correctly")
    timestamps = [e["timestamp"] for e in events]
    check(timestamps == sorted(timestamps), "Events are sorted chronologically")
    for event in events:
        check("record_type" in event, f"Event has record_type field")
        check("stage" in event, f"Event has stage field")
        check("sentiment" in event, f"Event has sentiment field")
        check("timestamp" in event, f"Event has timestamp field")
        if event["record_type"] == "call":
            check("transcript" in event, "Call event has transcript")
            check(len(event["transcript"]) > 200, "Call transcript has meaningful length")
            check("summary" in event, "Call event has summary")
        if event["record_type"] == "email":
            check("body" in event, "Email event has body")
            check("thread_id" in event, "Email event has thread_id")
            check("subject" in event, "Email event has subject")
        if event["record_type"] == "crm_note":
            check("content" in event, "CRM note has content")
            check("is_internal" in event, "CRM note has is_internal flag")

def test_404(deal_id: str):
    """Test 404 on nonexistent deal."""
    print(f"\n[4/4] GET /api/deals/nonexistent-id (expect 404)")
    r = httpx.get(f"{BASE_URL}/api/deals/00000000-0000-0000-0000-000000000000", timeout=10.0)
    check(r.status_code == 404, f"Status code is 404 (got {r.status_code})")

if __name__ == "__main__":
    print("=" * 50)
    print("Ycrest Deal Generator — Smoke Test")
    print("=" * 50)
    print(f"Target: {BASE_URL}")
    print("Config: minimal (2 calls, 1 email/stage, simple)")

    deal_id = test_generate()
    test_list_deals(deal_id)
    test_get_deal(deal_id)
    test_404(deal_id)

    print("\n" + "=" * 50)
    print("All tests passed.")
    print("=" * 50)
