import os
from pathlib import Path

_TEST_DB_PATH = Path(__file__).parent / "test_azurerose.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TEST_DB_PATH}"

if _TEST_DB_PATH.exists():
    _TEST_DB_PATH.unlink()


def pytest_sessionfinish(session, exitstatus):
    if _TEST_DB_PATH.exists():
        _TEST_DB_PATH.unlink()
