#!/usr/bin/env python3
"""
Comprehensive stress test suite runner.
Runs all test categories, collects metrics, generates report.
"""

import subprocess
import sys
from pathlib import Path

def run_tests():
    """Run all test suites and generate report."""

    backend_dir = Path(__file__).parent.parent
    test_dir = Path(__file__).parent

    test_suites = [
        ("Parameter Edge Cases", "test_parameter_edge_cases.py"),
        ("Concurrent Load", "test_concurrent_load.py"),
        ("Output Validation", "test_output_validation.py"),
        ("Performance & Cost", "test_performance_cost.py"),
        ("Error Resilience", "test_error_resilience.py"),
        ("Rate Limiter & Cache", "test_rate_limiter_cache.py"),
        ("Token Budget Limits", "test_token_budget_limits.py"),
        ("API vs Direct", "test_api_vs_direct.py"),
    ]

    print("\n" + "="*60)
    print("STRESS TEST SUITE RUNNER")
    print("="*60 + "\n")

    results = {}

    for name, module in test_suites:
        print(f"\n[Running] {name}...")

        result = subprocess.run(
            ["python", "-m", "pytest", str(test_dir / module), "-v", "--tb=short"],
            cwd=str(backend_dir),
            capture_output=True,
            text=True,
        )

        passed = result.stdout.count(" PASSED")
        failed = result.stdout.count(" FAILED")

        results[name] = {
            "passed": passed,
            "failed": failed,
            "exit_code": result.returncode,
        }

        status = "✓ PASSED" if result.returncode == 0 else "✗ FAILED"
        print(f"[Result] {name}: {status} ({passed} passed, {failed} failed)")

    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    total_passed = sum(r["passed"] for r in results.values())
    total_failed = sum(r["failed"] for r in results.values())
    all_passed = all(r["exit_code"] == 0 for r in results.values())

    for name, result in results.items():
        status = "✓" if result["exit_code"] == 0 else "✗"
        print(f"{status} {name}: {result['passed']} passed, {result['failed']} failed")

    print(f"\nTotal: {total_passed} passed, {total_failed} failed")

    if all_passed:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
