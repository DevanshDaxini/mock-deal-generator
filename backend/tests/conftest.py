import pytest
import asyncio
import subprocess
import time
import os
import sys
import socket
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def api_server():
    """
    Start the FastAPI server in background for integration tests.
    Yields the base URL, then stops the server.
    """
    # Check if port 8001 already in use
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    port_available = sock.connect_ex(('localhost', 8001)) != 0
    sock.close()

    if not port_available:
        pytest.skip("Port 8001 already in use - skipping API integration tests")

    # Start backend server
    try:
        server_process = subprocess.Popen(
            ["uvicorn", "main:app", "--port", "8001"],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError:
        pytest.skip("uvicorn not installed - skipping API integration tests")

    # Wait for server to be ready (with retries)
    max_retries = 10
    for i in range(max_retries):
        time.sleep(0.5)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        if sock.connect_ex(('localhost', 8001)) == 0:
            sock.close()
            break
        sock.close()
    else:
        server_process.terminate()
        pytest.skip("Failed to start API server - skipping API integration tests")

    yield "http://localhost:8001"

    # Cleanup: stop server
    try:
        server_process.terminate()
        server_process.wait(timeout=5)
    except Exception:
        server_process.kill()


@pytest.fixture(scope="session")
def metrics_collector():
    """Global metrics collector for performance tests."""
    from tests.stress_test_harness import MetricsCollector
    collector = MetricsCollector()
    yield collector
    # Save report after all tests
    collector.print_summary()
    collector.save_report()
