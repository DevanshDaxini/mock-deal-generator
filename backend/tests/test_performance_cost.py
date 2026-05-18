import pytest
import time
import hashlib
import json
from tests.fixtures import create_baseline_config
from tests.stress_test_harness import MetricsCollector, TestMetrics
from generator import generate_complete_deal


class TestPerformanceAndCost:
    """Test generation speed, token usage, and cost."""

    @pytest.mark.asyncio
    async def test_simple_deal_performance(self, metrics_collector):
        """Measure performance of simple deal generation."""
        config = create_baseline_config()
        config["complexity"] = "simple"
        config["num_calls"] = 1
        config["emails_per_stage"] = 1

        start = time.time()
        result = await generate_complete_deal(config, progress_callback=None)
        elapsed = time.time() - start

        assert result is not None

        config_hash = hashlib.md5(json.dumps(config, sort_keys=True).encode()).hexdigest()
        token_usage = result.get("token_usage", {})
        metric = TestMetrics(
            test_name="simple_deal",
            config_hash=config_hash,
            start_time=start,
            elapsed_seconds=elapsed,
            tokens_used=token_usage.get("total_billable", 0),
            input_tokens=token_usage.get("total_input", 0),
            output_tokens=token_usage.get("total_output", 0),
            events_generated=len(result["events"]),
            success=True,
        )
        metrics_collector.add_metric(metric)

        print(f"Simple deal: {elapsed:.2f}s, {len(result['events'])} events")

    @pytest.mark.asyncio
    async def test_complex_deal_performance(self, metrics_collector):
        """Measure performance of complex deal generation."""
        config = create_baseline_config()
        config["complexity"] = "messy"
        config["sales_cycle_length_days"] = 180
        config["num_calls"] = 10
        config["emails_per_stage"] = 5
        config["num_stakeholders"] = 8

        start = time.time()
        result = await generate_complete_deal(config, progress_callback=None)
        elapsed = time.time() - start

        assert result is not None

        config_hash = hashlib.md5(json.dumps(config, sort_keys=True).encode()).hexdigest()
        token_usage = result.get("token_usage", {})
        metric = TestMetrics(
            test_name="complex_deal",
            config_hash=config_hash,
            start_time=start,
            elapsed_seconds=elapsed,
            tokens_used=token_usage.get("total_billable", 0),
            input_tokens=token_usage.get("total_input", 0),
            output_tokens=token_usage.get("total_output", 0),
            events_generated=len(result["events"]),
            success=True,
        )
        metrics_collector.add_metric(metric)

        print(f"Complex deal: {elapsed:.2f}s, {len(result['events'])} events")

    @pytest.mark.asyncio
    async def test_tokens_per_event(self):
        """Measure average tokens per event generated."""
        config = create_baseline_config()
        result = await generate_complete_deal(config, progress_callback=None)

        event_count = len(result["events"])
        token_usage = result.get("token_usage", {})
        total_tokens = token_usage.get("total_billable", 0)

        avg_tokens_per_event = total_tokens / event_count if event_count > 0 else 0

        print(f"Avg tokens/event: {avg_tokens_per_event:.0f}")
