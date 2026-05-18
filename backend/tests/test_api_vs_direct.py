import pytest
import httpx
import json
import time
import asyncio
from tests.fixtures import create_baseline_config, validate_deal_structure
from generator import generate_complete_deal


@pytest.mark.asyncio
class TestAPIVsDirect:
    """Compare API endpoint behavior against direct generator calls."""

    async def test_same_config_same_output_structure(self, api_server):
        """Verify API and direct generator produce same output structure."""
        config = create_baseline_config()

        direct_result = await generate_complete_deal(config, progress_callback=None)

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{api_server}/api/generate-stream",
                json=config,
                timeout=300.0,
            ) as response:
                assert response.status_code == 200

                api_result = None
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        event_data = json.loads(line[6:])
                        if event_data.get("type") == "complete":
                            api_result = event_data.get("deal", {})

        assert "deal_id" in direct_result
        assert "deal_id" in api_result
        assert "events" in direct_result
        assert "events" in api_result

        direct_valid, direct_errors = validate_deal_structure(direct_result)
        api_valid, api_errors = validate_deal_structure(api_result)

        assert direct_valid, f"Direct generator output invalid: {direct_errors}"
        assert api_valid, f"API output invalid: {api_errors}"

    async def test_concurrent_api_calls(self, api_server):
        """Test multiple concurrent API requests."""
        config = create_baseline_config()

        async def make_api_call():
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{api_server}/api/generate-stream",
                    json=config,
                    timeout=300.0,
                ) as response:
                    complete_event = None
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            event_data = json.loads(line[6:])
                            if event_data.get("type") == "complete":
                                complete_event = event_data
                    return complete_event

        start = time.time()
        results = await asyncio.gather(
            make_api_call(),
            make_api_call(),
            make_api_call(),
        )
        elapsed = time.time() - start

        assert len(results) == 3
        assert all(r is not None for r in results)

        print(f"Concurrent 3 API calls: {elapsed:.2f}s")
