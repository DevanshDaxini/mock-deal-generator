#!/usr/bin/env python3
"""
Comprehensive stress test suite runner.
Runs all test categories, collects metrics, generates report.
"""

import subprocess
import sys
from pathlib import Path
import time


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

    print("\n" + "="*70)
    print("STRESS TEST SUITE RUNNER")
    print("="*70 + "\n")

    results = {}
    total_start = time.time()

    for idx, (name, module) in enumerate(test_suites, 1):
        progress = f"[{idx}/{len(test_suites)}]"
        print(f"\n[Running] {name}...\n")
        suite_start = time.time()

        process = subprocess.Popen(
            ["python", "-m", "pytest", str(test_dir / module), "-v", "--tb=short"],
            cwd=str(backend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        output_lines = []
        for line in process.stdout:
            print(line, end="", flush=True)
            output_lines.append(line)

        process.wait()
        elapsed = time.time() - suite_start
        full_output = "".join(output_lines)

        passed = full_output.count(" PASSED")
        failed = full_output.count(" FAILED")

        results[name] = {
            "passed": passed,
            "failed": failed,
            "exit_code": process.returncode,
            "elapsed": elapsed,
        }

        status = "✓" if process.returncode == 0 else "✗"
        print(f"\n{progress} {status} {name}: {passed} passed, {failed} failed in {elapsed:.1f}s")

    total_elapsed = time.time() - total_start
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)

    total_passed = sum(r["passed"] for r in results.values())
    total_failed = sum(r["failed"] for r in results.values())
    all_passed = all(r["exit_code"] == 0 for r in results.values())

    for name, result in results.items():
        status = "✓" if result["exit_code"] == 0 else "✗"
        print(f"{status} {name:30s} {result['passed']:2d}P {result['failed']:2d}F {result['elapsed']:6.1f}s")

    print("-"*70)
    print(f"Total: {total_passed} passed, {total_failed} failed in {total_elapsed:.1f}s")

    if all_passed:
        print("\n✅ ALL TESTS PASSED!")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
