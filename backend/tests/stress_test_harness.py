import json
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict, Any
from datetime import datetime


@dataclass
class TestMetrics:
    """Single test run metrics."""
    test_name: str
    config_hash: str
    start_time: float
    elapsed_seconds: float
    tokens_used: int
    input_tokens: int
    output_tokens: int
    events_generated: int
    success: bool
    error_message: str = ""


class MetricsCollector:
    """Collect and report test metrics."""

    def __init__(self, output_dir: Path = None):
        self.output_dir = output_dir or Path("backend/tests/reports")
        self.output_dir.mkdir(exist_ok=True)
        self.metrics: List[TestMetrics] = []

    def add_metric(self, metric: TestMetrics):
        """Record a single test metric."""
        self.metrics.append(metric)

    def save_report(self, filename: str = None):
        """Save metrics to JSON file."""
        if not filename:
            filename = f"stress_report_{datetime.now().isoformat()}.json"

        filepath = self.output_dir / filename

        data = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(self.metrics),
            "successful": sum(1 for m in self.metrics if m.success),
            "failed": sum(1 for m in self.metrics if not m.success),
            "total_tokens": sum(m.tokens_used for m in self.metrics),
            "total_events": sum(m.events_generated for m in self.metrics),
            "avg_time_per_test": sum(m.elapsed_seconds for m in self.metrics) / len(self.metrics) if self.metrics else 0,
            "metrics": [asdict(m) for m in self.metrics],
        }

        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

        print(f"Report saved to {filepath}")

    def print_summary(self):
        """Print test summary to console."""
        print("\n" + "="*60)
        print("STRESS TEST SUMMARY")
        print("="*60)
        print(f"Total tests: {len(self.metrics)}")
        print(f"Successful: {sum(1 for m in self.metrics if m.success)}")
        print(f"Failed: {sum(1 for m in self.metrics if not m.success)}")
        print(f"Total tokens: {sum(m.tokens_used for m in self.metrics)}")
        print(f"Total events: {sum(m.events_generated for m in self.metrics)}")
        if self.metrics:
            print(f"Avg time: {sum(m.elapsed_seconds for m in self.metrics) / len(self.metrics):.2f}s")
        print("="*60 + "\n")
