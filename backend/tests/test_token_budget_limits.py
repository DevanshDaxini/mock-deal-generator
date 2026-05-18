import pytest
from tests.fixtures import create_baseline_config
from generator import generate_complete_deal


class TestTokenBudgetLimits:
    """Test generator respects token budget limits across stages."""

    @pytest.mark.asyncio
    async def test_stage1_token_limit(self):
        """Verify Stage 1 (analysis) stays under token limit."""
        config = create_baseline_config()
        result = await generate_complete_deal(config, progress_callback=None)

        assert result is not None
        token_usage = result.get("token_usage", {})
        stage1_tokens = token_usage.get("stage1_output", 0)
        stage1_limit = 4000

        assert stage1_tokens <= stage1_limit, f"Stage 1 exceeded limit: {stage1_tokens} > {stage1_limit}"

    @pytest.mark.asyncio
    async def test_stage2_token_limit(self):
        """Verify Stage 2 (narrative) stays under token limit."""
        config = create_baseline_config()
        result = await generate_complete_deal(config, progress_callback=None)

        assert result is not None
        token_usage = result.get("token_usage", {})
        stage2_tokens = token_usage.get("stage2_output", 0)
        stage2_limit = 6000

        assert stage2_tokens <= stage2_limit, f"Stage 2 exceeded limit: {stage2_tokens} > {stage2_limit}"

    @pytest.mark.asyncio
    async def test_stage3_token_limit(self):
        """Verify Stage 3 (events) stays under token limit."""
        config = create_baseline_config()
        result = await generate_complete_deal(config, progress_callback=None)

        assert result is not None
        token_usage = result.get("token_usage", {})
        stage3_tokens = token_usage.get("stage3_output", 0)
        stage3_limit = 8000

        assert stage3_tokens <= stage3_limit, f"Stage 3 exceeded limit: {stage3_tokens} > {stage3_limit}"

    @pytest.mark.asyncio
    async def test_total_tokens_reasonable(self):
        """Verify total tokens are reasonable for deal complexity."""
        config = create_baseline_config()
        result = await generate_complete_deal(config, progress_callback=None)

        assert result is not None
        token_usage = result.get("token_usage", {})
        total_tokens = token_usage.get("total_billable", 0)
        event_count = len(result["events"])

        estimated_min = event_count * 300
        estimated_max = event_count * 3000

        assert total_tokens >= estimated_min, f"Tokens low: {total_tokens} < {estimated_min}"
        assert total_tokens <= estimated_max, f"Tokens high: {total_tokens} > {estimated_max}"

    @pytest.mark.asyncio
    async def test_complex_config_within_limits(self):
        """Verify even complex configs stay within total token budget."""
        config = create_baseline_config()
        config["complexity"] = "messy"
        config["sales_cycle_length_days"] = 180
        config["num_calls"] = 10
        config["emails_per_stage"] = 5
        config["num_stakeholders"] = 8

        result = await generate_complete_deal(config, progress_callback=None)

        assert result is not None
        token_usage = result.get("token_usage", {})
        total_tokens = token_usage.get("total_billable", 0)
        total_limit = 20000

        assert total_tokens <= total_limit, f"Total exceeded budget: {total_tokens} > {total_limit}"
