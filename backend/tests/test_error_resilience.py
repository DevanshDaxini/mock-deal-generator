import pytest
from tests.fixtures import create_baseline_config
from generator import generate_complete_deal


class TestErrorResilience:
    """Test handling of invalid inputs and error conditions."""

    @pytest.mark.asyncio
    async def test_invalid_sales_cycle_too_short(self):
        """Test that invalid sales cycle (< 14 days) is rejected."""
        config = create_baseline_config()
        config["sales_cycle_length_days"] = 5

        with pytest.raises((ValueError, AssertionError)):
            await generate_complete_deal(config, progress_callback=None)

    @pytest.mark.asyncio
    async def test_invalid_sales_cycle_too_long(self):
        """Test that invalid sales cycle (> 180 days) is rejected."""
        config = create_baseline_config()
        config["sales_cycle_length_days"] = 365

        with pytest.raises((ValueError, AssertionError)):
            await generate_complete_deal(config, progress_callback=None)

    @pytest.mark.asyncio
    async def test_invalid_stakeholder_count_too_few(self):
        """Test that invalid stakeholder count (< 2) is rejected."""
        config = create_baseline_config()
        config["num_stakeholders"] = 1

        with pytest.raises((ValueError, AssertionError)):
            await generate_complete_deal(config, progress_callback=None)

    @pytest.mark.asyncio
    async def test_invalid_stakeholder_count_too_many(self):
        """Test that invalid stakeholder count (> 8) is rejected."""
        config = create_baseline_config()
        config["num_stakeholders"] = 10

        with pytest.raises((ValueError, AssertionError)):
            await generate_complete_deal(config, progress_callback=None)

    @pytest.mark.asyncio
    async def test_invalid_sentiment_enum(self):
        """Test that invalid sentiment is rejected."""
        config = create_baseline_config()
        config["starting_sentiment"] = "happy"

        with pytest.raises((ValueError, AssertionError, KeyError)):
            await generate_complete_deal(config, progress_callback=None)

    @pytest.mark.asyncio
    async def test_invalid_champion_entry_enum(self):
        """Test that invalid champion entry is rejected."""
        config = create_baseline_config()
        config["champion_entry"] = "unknown_time"

        with pytest.raises((ValueError, AssertionError, KeyError)):
            await generate_complete_deal(config, progress_callback=None)

    @pytest.mark.asyncio
    async def test_missing_required_field_industry(self):
        """Test that missing required field is rejected."""
        config = create_baseline_config()
        del config["industry"]

        with pytest.raises((TypeError, ValueError, KeyError)):
            await generate_complete_deal(config, progress_callback=None)

    @pytest.mark.asyncio
    async def test_null_deal_id_not_generated(self):
        """Test that deal_id is always generated."""
        config = create_baseline_config()
        result = await generate_complete_deal(config, progress_callback=None)

        assert result["deal_id"] is not None
        assert len(result["deal_id"]) > 0

    @pytest.mark.asyncio
    async def test_empty_events_list_not_allowed(self):
        """Test that deal always has events."""
        config = create_baseline_config()
        result = await generate_complete_deal(config, progress_callback=None)

        assert len(result["events"]) > 0
