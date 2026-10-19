import unittest

from operational_error_reporter import _validate_endpoint


class OperationalErrorReporterTests(unittest.TestCase):
    def test_operational_error_endpoint_is_loopback_only(self) -> None:
        endpoint = "http://127.0.0.1:4434/api/internal/operational-errors"
        self.assertEqual(_validate_endpoint(endpoint), endpoint)
        with self.assertRaises(ValueError):
            _validate_endpoint("https://example.com/api/internal/operational-errors")
        with self.assertRaises(ValueError):
            _validate_endpoint("http://127.0.0.1:4435/health")


if __name__ == "__main__":
    unittest.main()
