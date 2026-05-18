import pytest
import asyncio
import time
from tests.fixtures import create_baseline_config, count_events_by_type
from generator import generate_complete_deal


class TestConcurrentLoad:
    """Test generator with concurrent requests."""

    @pytest.mark.asyncio
    async def test_concurrent_single_deals_2(self):
        """Generate 2 deals concurrently."""
        config = create_baseline_config()

        start = time.time()
        results = await asyncio.gather(
            generate_complete_deal(config, progress_callback=None),
            generate_complete_deal(config, progress_callback=None),
        )
        elapsed = time.time() - start

        assert len(results) == 2
        assert all(r is not None for r in results)
        assert results[0]["deal_id"] != results[1]["deal_id"]

        print(f"Concurrent 2 deals: {elapsed:.2f}s")

    @pytest.mark.asyncio
    async def test_concurrent_single_deals_4(self):
        """Generate 4 deals concurrently."""
        config = create_baseline_config()

        start = time.time()
        results = await asyncio.gather(
            *[generate_complete_deal(config, progress_callback=None) for _ in range(4)]
        )
        elapsed = time.time() - start

        assert len(results) == 4
        assert all(r is not None for r in results)

        deal_ids = [r["deal_id"] for r in results]
        assert len(set(deal_ids)) == 4

        print(f"Concurrent 4 deals: {elapsed:.2f}s")

    @pytest.mark.asyncio
    async def test_concurrent_different_configs(self):
        """Generate deals with varied configs concurrently."""
        configs = [
            {**create_baseline_config(), "complexity": "simple", "num_calls": 1},
            {**create_baseline_config(), "complexity": "normal", "num_calls": 5},
            {**create_baseline_config(), "complexity": "messy", "num_calls": 10},
        ]

        results = await asyncio.gather(
            *[generate_complete_deal(cfg, progress_callback=None) for cfg in configs]
        )

        assert len(results) == 3
        assert all(r is not None for r in results)

        assert results[0]["metadata"]["complexity"] == "simple"
        assert results[1]["metadata"]["complexity"] == "normal"
        assert results[2]["metadata"]["complexity"] == "messy"
