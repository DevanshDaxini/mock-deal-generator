# Stress Testing Guide

This guide explains how to run and interpret the mock-deal-generator stress tests.

## What is stress testing?

Stress testing validates that the system performs reliably under wide parameter ranges, concurrent loads, and edge cases. This suite covers:

- **Parameter edge cases:** Minimum/maximum inputs, all enum values, unicode, special characters
- **Concurrent load:** Multiple deals generated simultaneously
- **Output validation:** Deal structure, sentiment arcs, timeline ordering, stakeholder data
- **Performance:** Generation time, token usage, cost estimation
- **Error resilience:** Invalid inputs, boundary conditions, error handling
- **Rate limiter & cache:** Concurrent request handling and cache effectiveness
- **Token budgets:** Stage-wise and total token usage limits
- **API vs direct:** Comparing API endpoint and direct generator output

## Setup

1. Install test dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Set up `.env` with your Anthropic API key:
   ```bash
   cp .env.example .env
   # Edit .env and add ANTHROPIC_API_KEY
   ```

## Running tests

### Run all stress tests
```bash
cd backend
python -m pytest tests/ -v
```

### Run specific test category
```bash
# Parameter edge cases only
python -m pytest tests/test_parameter_edge_cases.py -v

# Concurrent load only
python -m pytest tests/test_concurrent_load.py -v

# Output validation only
python -m pytest tests/test_output_validation.py -v

# Performance & cost only
python -m pytest tests/test_performance_cost.py -v

# Error resilience only
python -m pytest tests/test_error_resilience.py -v

# Rate limiter & cache only
python -m pytest tests/test_rate_limiter_cache.py -v

# Token budget limits only
python -m pytest tests/test_token_budget_limits.py -v

# API vs direct comparison only
python -m pytest tests/test_api_vs_direct.py -v
```

### Run with minimal output
```bash
cd backend
python -m pytest tests/ --tb=short
```

### Run with comprehensive test runner
```bash
cd backend
python tests/run_stress_tests.py
```

## Interpreting results

### Success indicators
- All tests PASS
- No timeout errors
- Metrics report generated in `backend/tests/reports/`
- Token usage matches estimates (±10%)

### Common failures

**Test timeout (60+ seconds per deal):**
- API rate limiting or network issue
- Increase timeout: `pytest --timeout=600`

**Sentiment arc validation fails:**
- Check that ending sentiment matches deal outcome
- Won deals should trend positive, lost deals negative

**Event count mismatch:**
- Check event counts match config (num_calls, emails_per_stage)
- Some variation expected due to LLM generation

**Token usage exceeds estimate:**
- Reduce num_calls or num_stakeholders
- Enable prompt caching in Stage 3 for larger deals

**Invalid JSON response:**
- Claude response malformed
- Check Claude is returning valid JSON
- Try again (transient error)

## Performance baselines

Expected metrics (Claude Haiku):

| Deal Type | Events | Time | Tokens | Cost |
|-----------|--------|------|--------|------|
| Simple (14d, 1 call, 1 email) | ~8 | ~30s | ~2000 | $0.02 |
| Normal (30d, 3 calls, 2 emails) | ~20 | ~60s | ~5000 | $0.05 |
| Complex (180d, 10 calls, 5 emails) | ~50 | ~120s | ~12000 | $0.12 |

Your actual times will vary based on:
- API latency and rate limiting
- Network connectivity
- Concurrent requests
- LLM response variance

## Cost estimation

After running tests, check the metrics report:

```bash
cat backend/tests/reports/stress_report_*.json
```

Look for:
- `total_tokens` — sum of all tokens used
- `total_events` — total events generated
- Cost = (total_tokens / 1M) * $0.80 (Haiku pricing)

## Troubleshooting

**"ANTHROPIC_API_KEY not found"**
- Check `.env` file exists and has valid key

**"ModuleNotFoundError: No module named 'anthropic'"**
- Install dependencies: `pip install -r requirements.txt`

**"Connection refused"**
- For API tests, ensure backend running: `uvicorn main:app --port 8001`

**"Rate limit exceeded"**
- Wait 60+ seconds and retry
- Reduce concurrent test count

**"pytest: command not found"**
- Install pytest: `pip install pytest pytest-asyncio`
