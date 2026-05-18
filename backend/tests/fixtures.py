"""Test fixtures and helper functions."""

from typing import Dict, List, Any
from datetime import datetime


def create_baseline_config():
    """Create a baseline configuration for testing."""
    return {
        "company_name": None,
        "industry": "Fintech",
        "deal_size": "$75k ARR",
        "sales_cycle_length_days": 30,
        "starting_sentiment": "neutral",
        "ending_sentiment": "positive",
        "deal_outcome": "closed_won",
        "champion_entry": "during_discovery",
        "main_objection": "Budget Approval",
        "buyer_urgency": "medium",
        "num_calls": 3,
        "emails_per_stage": 2,
        "num_stakeholders": 3,
        "complexity": "normal",
        "cs_scenario": None,
        "ae_name": None,
        "se_name": None,
        "business_use_case": None,
        "is_series": False,
    }


def validate_deal_structure(deal_data: Dict[str, Any]) -> tuple[bool, List[str]]:
    """
    Validate deal NDJson structure (metadata + events).
    Returns (is_valid, list_of_errors).
    """
    errors = []

    if "deal_id" not in deal_data:
        errors.append("Missing 'deal_id'")
    if "company_name" not in deal_data:
        errors.append("Missing 'company_name'")
    if "stakeholders" not in deal_data:
        errors.append("Missing 'stakeholders'")
    if "sentiment_arc" not in deal_data:
        errors.append("Missing 'sentiment_arc'")
    if "events" not in deal_data:
        errors.append("Missing 'events'")
    else:
        events = deal_data["events"]
        if not isinstance(events, list):
            errors.append("'events' must be a list")
        else:
            for i, event in enumerate(events):
                if "timestamp" not in event:
                    errors.append(f"Event {i} missing 'timestamp'")
                if "type" not in event:
                    errors.append(f"Event {i} missing 'type'")
                if "participants" not in event:
                    errors.append(f"Event {i} missing 'participants'")

    return (len(errors) == 0, errors)


def validate_sentiment_arc(sentiment_arc: List[str]) -> tuple[bool, List[str]]:
    """
    Validate sentiment arc is non-empty and contains valid sentiments.
    Returns (is_valid, list_of_errors).
    """
    errors = []
    valid_sentiments = {"positive", "neutral", "concerned", "negative"}

    if not sentiment_arc:
        errors.append("Sentiment arc is empty")
        return (False, errors)

    for i, sentiment in enumerate(sentiment_arc):
        if sentiment not in valid_sentiments:
            errors.append(f"Position {i}: invalid sentiment '{sentiment}'")

    return (len(errors) == 0, errors)


def validate_timeline_chronological(events: List[Dict[str, Any]]) -> tuple[bool, List[str]]:
    """
    Validate events are sorted chronologically by timestamp.
    Returns (is_valid, list_of_errors).
    """
    errors = []

    if not events:
        return (True, [])

    timestamps = []
    for i, event in enumerate(events):
        ts_str = event.get("timestamp", "")
        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            timestamps.append((i, ts))
        except (ValueError, AttributeError):
            errors.append(f"Event {i} has invalid timestamp: {ts_str}")

    for i in range(1, len(timestamps)):
        prev_idx, prev_ts = timestamps[i - 1]
        curr_idx, curr_ts = timestamps[i]
        if curr_ts < prev_ts:
            errors.append(f"Event {curr_idx} ({curr_ts}) is before Event {prev_idx} ({prev_ts})")

    return (len(errors) == 0, errors)


def count_events_by_type(events: List[Dict[str, Any]]) -> Dict[str, int]:
    """Count events grouped by type."""
    counts = {}
    for event in events:
        event_type = event.get("type", "unknown")
        counts[event_type] = counts.get(event_type, 0) + 1
    return counts
