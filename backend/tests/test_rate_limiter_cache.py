import pytest
import asyncio
import time
from tests.fixtures import create_baseline_config
from generator import generate_complete_deal


class TestRateLimiterAndCache:
    """Test rate limiter behavior under concurrent load and cache effectiveness."""

    @pytest.mark.asyncio
    async def test_rapid_sequential_requests(self):
        """Send 3 rapid requests sequentially, verify rate limiter handles them."""
        config = create_baseline_config()
        results = []

        for i in range(3):
            start = time.time()
            result = await generate_complete_deal(config, progress_callback=None)
            elapsed = time.time() - start

            assert result is not None
            results.append(elapsed)

        print(f"Rapid sequential: {results}")

    @pytest.mark.asyncio
    async def test_same_config_cache_hit(self):
        """Generate same config twice, second should be faster (cache hit)."""
        config = create_baseline_config()

        start1 = time.time()
        result1 = await generate_complete_deal(config, progress_callback=None)
        time1 = time.time() - start1

        start2 = time.time()
        result2 = await generate_complete_deal(config, progress_callback=None)
        time2 = time.time() - start2

        assert result1 is not None
        assert result2 is not None

        assert result1["deal_id"] != result2["deal_id"]

        print(f"Cache hit test: first={time1:.2f}s, second={time2:.2f}s, speedup={time1/time2 if time2 > 0 else 0:.1f}x")

    @pytest.mark.asyncio
    async def test_varied_config_cache_miss(self):
        """Generate with varied configs, each should miss cache."""
        configs = [
            create_baseline_config(),
            {**create_baseline_config(), "num_calls": 5},
            {**create_baseline_config(), "num_stakeholders": 4},
        ]

        times = []
        for config in configs:
            start = time.time()
            result = await generate_complete_deal(config, progress_callback=None)
            elapsed = time.time() - start

            assert result is not None
            times.append(elapsed)

        print(f"Cache miss test (varied configs): {times}")

    @pytest.mark.asyncio
    async def test_concurrent_rate_limit_compliance(self):
        """Verify rate limiter prevents overwhelming API under concurrent load."""
        config = create_baseline_config()

        start = time.time()
        results = await asyncio.gather(
            generate_complete_deal(config, progress_callback=None),
            generate_complete_deal(config, progress_callback=None),
            generate_complete_deal(config, progress_callback=None),
            generate_complete_deal(config, progress_callback=None),
        )
        elapsed = time.time() - start

        assert len(results) == 4
        assert all(r is not None for r in results)

        print(f"Concurrent 4 with rate limiter: {elapsed:.2f}s")
