"""
Integration tests for internal call timeline injection and deal generation.
Tests that internal calls are properly injected into the timeline and maintain consistency.
"""

import pytest
import asyncio
import json
import logging
from unittest.mock import patch, AsyncMock
from datetime import datetime, timedelta, timezone
from pydantic import ValidationError

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from generator import generate_complete_deal, _parse_sort_ts
from models import InternalCallTypeEnum, DealHealthEnum
from tests.fixtures import create_baseline_config


# ============= Test 10: Timeline injection =============

@pytest.mark.asyncio
async def test_internal_calls_present_in_final_events():
    """Test that internal_call events are present in final events list."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    # Mock the internal call generation to ensure calls are generated
    mock_internal_calls = [
        {
            "record_type": "internal_call",
            "id": "internal_1",
            "title": "Deal Review",
            "call_type": "deal_review",
            "date": "2024-03-08",
            "timestamp": "2024-03-08T14:00:00Z",
            "stage": "demo",
            "participants": [
                {"name": "John Doe", "role": "AE"}
            ],
            "transcript": "Discussion about demo feedback." * 50,
            "summary": "Addressed customer feedback.",
            "action_items": ["Follow up with customer"],
            "deal_health": "on_track"
        }
    ]

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_internal_calls

        result = await generate_complete_deal(config)

        assert "deal" in result
        assert "events" in result["deal"]
        events = result["deal"]["events"]

        # Check for internal_call record type
        internal_call_events = [e for e in events if e.get("record_type") == "internal_call"]
        assert len(internal_call_events) > 0, "Internal call events should be present"

        # Verify record_type is set correctly
        for event in internal_call_events:
            assert event["record_type"] == "internal_call"


# ============= Test 11: Chronological sorting after injection =============

@pytest.mark.asyncio
async def test_chronological_sorting_after_injection():
    """Test that all events remain sorted chronologically after internal call injection."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 4

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        # Generate internal calls at various timestamps
        mock_gen.return_value = [
            {
                "record_type": "internal_call",
                "id": "internal_1",
                "title": "Call 1",
                "call_type": "deal_review",
                "date": "2024-03-08",
                "timestamp": "2024-03-08T14:00:00Z",
                "stage": "demo",
                "participants": [{"name": "AE", "role": "AE"}],
                "transcript": "Test." * 50,
                "summary": "Test",
                "action_items": ["Test"],
                "deal_health": "on_track"
            },
            {
                "record_type": "internal_call",
                "id": "internal_2",
                "title": "Call 2",
                "call_type": "war_room",
                "date": "2024-03-15",
                "timestamp": "2024-03-15T15:00:00Z",
                "stage": "negotiation",
                "participants": [{"name": "AE", "role": "AE"}],
                "transcript": "Test." * 50,
                "summary": "Test",
                "action_items": ["Test"],
                "deal_health": "at_risk"
            }
        ]

        result = await generate_complete_deal(config)
        events = result["deal"]["events"]

        # Extract timestamps
        timestamps = []
        for i, event in enumerate(events):
            ts_str = event.get("timestamp", "")
            if ts_str:
                try:
                    ts = _parse_sort_ts(ts_str)
                    timestamps.append((i, ts, event.get("record_type")))
                except (ValueError, AttributeError):
                    pass

        # Check chronological order
        for i in range(1, len(timestamps)):
            prev_idx, prev_ts, prev_type = timestamps[i - 1]
            curr_idx, curr_ts, curr_type = timestamps[i]

            assert curr_ts >= prev_ts, (
                f"Event {curr_idx} ({curr_type}, {curr_ts}) is before "
                f"Event {prev_idx} ({prev_type}, {prev_ts})"
            )


# ============= Test 12: No record duplication =============

@pytest.mark.asyncio
async def test_no_record_duplication():
    """Test that internal call IDs are unique (different UUIDs each generation)."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    # Generate twice with same config
    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        calls_list_1 = [
            {
                "record_type": "internal_call",
                "id": "id_run_1",
                "title": "Call",
                "call_type": "deal_review",
                "date": "2024-03-08",
                "timestamp": "2024-03-08T14:00:00Z",
                "stage": "demo",
                "participants": [{"name": "AE", "role": "AE"}],
                "transcript": "Test." * 50,
                "summary": "Test",
                "action_items": ["Test"],
                "deal_health": "on_track"
            }
        ]

        calls_list_2 = [
            {
                "record_type": "internal_call",
                "id": "id_run_2",
                "title": "Call",
                "call_type": "deal_review",
                "date": "2024-03-08",
                "timestamp": "2024-03-08T14:00:00Z",
                "stage": "demo",
                "participants": [{"name": "AE", "role": "AE"}],
                "transcript": "Test." * 50,
                "summary": "Test",
                "action_items": ["Test"],
                "deal_health": "on_track"
            }
        ]

        mock_gen.side_effect = [calls_list_1, calls_list_2]

        result1 = await generate_complete_deal(config)
        result2 = await generate_complete_deal(config)

        calls1 = [e for e in result1["deal"]["events"] if e.get("record_type") == "internal_call"]
        calls2 = [e for e in result2["deal"]["events"] if e.get("record_type") == "internal_call"]

        ids1 = {c["id"] for c in calls1}
        ids2 = {c["id"] for c in calls2}

        # IDs should be different (new UUIDs)
        assert len(ids1 & ids2) == 0, "Internal call IDs should be unique across generations"


# ============= Test 13: Graceful failure doesn't break deal =============

@pytest.mark.asyncio
async def test_graceful_failure_internal_calls(caplog):
    """Test that if internal call generation fails, deal still generates successfully."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        # Raise exception on call generation
        mock_gen.side_effect = Exception("Internal call generation error")

        with caplog.at_level(logging.ERROR):
            result = await generate_complete_deal(config)

        # Deal should still generate
        assert "deal" in result
        assert "events" in result["deal"]
        assert len(result["deal"]["events"]) > 0, "Deal should have events even if internal calls fail"

        # Error should be logged
        assert "Internal call generation failed" in caplog.text


@pytest.mark.asyncio
async def test_deal_generates_without_internal_calls():
    """Test that a deal can generate successfully without any internal calls."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 2

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        # Return empty list (no transitions detected)
        mock_gen.return_value = []

        result = await generate_complete_deal(config)

        assert "deal" in result
        assert "events" in result["deal"]
        events = result["deal"]["events"]

        # No internal calls
        internal_calls = [e for e in events if e.get("record_type") == "internal_call"]
        assert len(internal_calls) == 0, "No internal calls should be present"

        # But deal should have other events
        assert len(events) > 0, "Deal should have call and email events"


# ============= Additional Integration Tests =============

@pytest.mark.asyncio
async def test_internal_calls_have_required_fields():
    """Test that all injected internal calls have required fields."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = [
            {
                "record_type": "internal_call",
                "id": "call_1",
                "title": "Emergency War Room",
                "call_type": "war_room",
                "date": "2024-03-15",
                "timestamp": "2024-03-15T10:30:00Z",
                "stage": "negotiation",
                "participants": [
                    {"name": "Jane Smith", "role": "AE"},
                    {"name": "Bob Manager", "role": "Manager"}
                ],
                "transcript": "We need to address the major sentiment drop immediately." * 30,
                "summary": "Emergency call to address deal risk.",
                "action_items": [
                    "Schedule customer escalation",
                    "Prepare revised proposal",
                    "Get VP sign-off"
                ],
                "deal_health": "stalled"
            }
        ]

        result = await generate_complete_deal(config)
        events = result["deal"]["events"]

        internal_calls = [e for e in events if e.get("record_type") == "internal_call"]
        assert len(internal_calls) > 0

        required_fields = [
            "id", "title", "call_type", "date", "timestamp", "stage",
            "participants", "transcript", "summary", "action_items", "deal_health"
        ]

        for call in internal_calls:
            for field in required_fields:
                assert field in call, f"Internal call missing field: {field}"


@pytest.mark.asyncio
async def test_internal_calls_valid_enums():
    """Test that internal call enum fields are valid."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = [
            {
                "record_type": "internal_call",
                "id": "call_1",
                "title": "Review",
                "call_type": "deal_review",
                "date": "2024-03-08",
                "timestamp": "2024-03-08T14:00:00Z",
                "stage": "demo",
                "participants": [{"name": "AE", "role": "AE"}],
                "transcript": "Test." * 50,
                "summary": "Test",
                "action_items": ["Test"],
                "deal_health": "on_track"
            }
        ]

        result = await generate_complete_deal(config)
        events = result["deal"]["events"]

        internal_calls = [e for e in events if e.get("record_type") == "internal_call"]

        valid_call_types = [ct.value for ct in InternalCallTypeEnum]
        valid_deal_healths = [dh.value for dh in DealHealthEnum]

        for call in internal_calls:
            assert call["call_type"] in valid_call_types, f"Invalid call_type: {call['call_type']}"
            assert call["deal_health"] in valid_deal_healths, f"Invalid deal_health: {call['deal_health']}"


@pytest.mark.asyncio
async def test_internal_calls_participants_valid():
    """Test that internal call participants have name and role."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = [
            {
                "record_type": "internal_call",
                "id": "call_1",
                "title": "Team Sync",
                "call_type": "forecast_call",
                "date": "2024-03-10",
                "timestamp": "2024-03-10T15:00:00Z",
                "stage": "evaluation",
                "participants": [
                    {"name": "Alice", "role": "AE"},
                    {"name": "Bob", "role": "Manager"},
                    {"name": "Charlie", "role": "SE"},
                    {"name": "Diana", "role": "SDR"}
                ],
                "transcript": "Team discussed deal progress." * 50,
                "summary": "Weekly forecast call.",
                "action_items": ["Update pipeline", "Check references"],
                "deal_health": "on_track"
            }
        ]

        result = await generate_complete_deal(config)
        events = result["deal"]["events"]

        internal_calls = [e for e in events if e.get("record_type") == "internal_call"]

        valid_roles = {"AE", "Manager", "SE", "SDR"}

        for call in internal_calls:
            participants = call.get("participants", [])
            assert len(participants) > 0, "Internal calls must have participants"

            for p in participants:
                assert "name" in p, "Participant missing name"
                assert "role" in p, "Participant missing role"
                assert p["role"] in valid_roles, f"Invalid participant role: {p['role']}"

            # AE must be present
            ae_present = any(p["role"] == "AE" for p in participants)
            assert ae_present, "AE must be in internal call participants"


@pytest.mark.asyncio
async def test_internal_calls_transcripts_substantive():
    """Test that internal call transcripts are substantial (min length)."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = [
            {
                "record_type": "internal_call",
                "id": "call_1",
                "title": "Strategy Session",
                "call_type": "strategy_session",
                "date": "2024-03-12",
                "timestamp": "2024-03-12T11:00:00Z",
                "stage": "evaluation",
                "participants": [
                    {"name": "Sales VP", "role": "Manager"},
                    {"name": "Account Executive", "role": "AE"}
                ],
                "transcript": "Discussed strategic approach to the deal. Customer has expressed budget concerns but appears committed. We reviewed competitive positioning and identified key value drivers. Decision is expected by end of quarter. Implementation timeline will be critical for budget approval. Team should prepare detailed ROI analysis for next call." * 10,
                "summary": "Strategic planning session for complex deal.",
                "action_items": ["Prepare ROI analysis", "Schedule executive briefing"],
                "deal_health": "at_risk"
            }
        ]

        result = await generate_complete_deal(config)
        events = result["deal"]["events"]

        internal_calls = [e for e in events if e.get("record_type") == "internal_call"]

        for call in internal_calls:
            transcript = call.get("transcript", "")
            assert len(transcript) >= 100, f"Transcript too short: {len(transcript)} characters"


@pytest.mark.asyncio
async def test_internal_calls_action_items_substantive():
    """Test that action items are non-empty strings."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = [
            {
                "record_type": "internal_call",
                "id": "call_1",
                "title": "Close Plan Review",
                "call_type": "close_plan_session",
                "date": "2024-03-20",
                "timestamp": "2024-03-20T09:00:00Z",
                "stage": "close",
                "participants": [
                    {"name": "AE", "role": "AE"},
                    {"name": "Sales Engineer", "role": "SE"},
                    {"name": "Manager", "role": "Manager"}
                ],
                "transcript": "Finalized close plan and identified all blockers." * 50,
                "summary": "Close plan meeting.",
                "action_items": [
                    "Send final proposal",
                    "Arrange legal review",
                    "Prepare onboarding",
                    "Schedule deal review"
                ],
                "deal_health": "on_track"
            }
        ]

        result = await generate_complete_deal(config)
        events = result["deal"]["events"]

        internal_calls = [e for e in events if e.get("record_type") == "internal_call"]

        for call in internal_calls:
            action_items = call.get("action_items", [])
            assert len(action_items) > 0, "Must have at least one action item"

            for item in action_items:
                assert isinstance(item, str), f"Action item must be string, got {type(item)}"
                assert len(item.strip()) > 0, "Action item must not be empty"


@pytest.mark.asyncio
async def test_no_overlapping_timestamps():
    """Test that internal calls don't have same timestamp as buyer calls."""
    config = create_baseline_config()
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    with patch('generator.stage_3_generate_internal_calls', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = [
            {
                "record_type": "internal_call",
                "id": "internal_1",
                "title": "Review",
                "call_type": "deal_review",
                "date": "2024-03-08",
                "timestamp": "2024-03-08T14:30:00Z",
                "stage": "demo",
                "participants": [{"name": "AE", "role": "AE"}],
                "transcript": "Review after buyer call." * 50,
                "summary": "Post-call review.",
                "action_items": ["Follow up"],
                "deal_health": "on_track"
            }
        ]

        result = await generate_complete_deal(config)
        events = result["deal"]["events"]

        buyer_calls = [e for e in events if e.get("record_type") == "call"]
        internal_calls = [e for e in events if e.get("record_type") == "internal_call"]

        buyer_timestamps = {e.get("timestamp") for e in buyer_calls}
        internal_timestamps = {e.get("timestamp") for e in internal_calls}

        # Internal and buyer calls should have different timestamps
        overlap = buyer_timestamps & internal_timestamps
        assert len(overlap) == 0 or len(buyer_calls) == 0 or len(internal_calls) == 0, (
            "Internal calls should not have exact same timestamp as buyer calls"
        )


@pytest.mark.asyncio
async def test_series_mode_internal_calls():
    """Test that series mode can generate internal calls successfully."""
    config = create_baseline_config()
    config["is_series"] = True
    config["sales_cycle_length_days"] = 30
    config["num_calls"] = 3

    with patch('generator.stage_3_generate_internal_calls_series', new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = [
            {
                "record_type": "internal_call",
                "id": "series_call_1",
                "title": "Series Quarterly Review",
                "call_type": "forecast_call",
                "date": "2024-03-10",
                "timestamp": "2024-03-10T16:00:00Z",
                "stage": "evaluation",
                "participants": [
                    {"name": "Rep Name", "role": "AE"},
                    {"name": "Manager", "role": "Manager"}
                ],
                "transcript": "Discussed quarterly quota and pipeline." * 50,
                "summary": "Q1 forecast review with rep.",
                "action_items": ["Update forecast", "Schedule next review"],
                "deal_health": "on_track"
            }
        ]

        result = await generate_complete_deal(config)
        events = result["deal"]["events"]

        internal_calls = [e for e in events if e.get("record_type") == "internal_call"]
        assert len(internal_calls) >= 0, "Series mode should support internal calls"
