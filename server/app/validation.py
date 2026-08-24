import re
from datetime import UTC, datetime
from urllib.parse import urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from flask import request

from .errors import APIError

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def json_body(*, allowed_fields: set[str] | None = None) -> dict:
    if not request.is_json:
        raise APIError("Request body must be JSON.", 415, "unsupported_media_type")
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError(
            "Request body must be a JSON object.", fields={"body": "Invalid JSON object."}
        )
    if allowed_fields is not None:
        unknown = sorted(set(payload) - allowed_fields)
        if unknown:
            raise APIError(
                "Request contains unsupported fields.",
                fields={"unknownFields": unknown},
            )
    return payload


def required_text(payload: dict, field: str, *, maximum: int, minimum: int = 1) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise APIError(
            "Please correct the highlighted fields.", fields={field: "This field is required."}
        )
    value = " ".join(value.split())
    if len(value) < minimum or len(value) > maximum:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: f"Use between {minimum} and {maximum} characters."},
        )
    return value


def optional_text(payload: dict, field: str, *, maximum: int, default=None):
    if field not in payload:
        return default
    value = payload[field]
    if value is None:
        return None
    if not isinstance(value, str):
        raise APIError("Please correct the highlighted fields.", fields={field: "Must be text."})
    value = " ".join(value.split())
    if len(value) > maximum:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: f"Use no more than {maximum} characters."},
        )
    return value or None


def email_address(value) -> str:
    email = str(value or "").strip().lower()
    if len(email) > 254 or not EMAIL_PATTERN.fullmatch(email):
        raise APIError(
            "Please enter a valid email address.",
            fields={"email": "Enter an address such as name@example.com."},
        )
    return email


def choice(payload: dict, field: str, allowed: set[str], *, default=None):
    value = payload.get(field, default)
    if value not in allowed:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: f"Choose one of: {', '.join(sorted(allowed))}."},
        )
    return value


def integer_value(
    payload: dict,
    field: str,
    *,
    minimum: int,
    maximum: int,
    default=None,
):
    if field not in payload:
        return default
    value = payload[field]
    if isinstance(value, bool):
        value = None
    try:
        value = int(value)
    except (TypeError, ValueError):
        value = None
    if value is None or value < minimum or value > maximum:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: f"Use a whole number from {minimum} to {maximum}."},
        )
    return value


def iso_datetime(payload: dict, field: str, *, required: bool = False, default=None):
    if field not in payload:
        if required:
            raise APIError(
                "Please correct the highlighted fields.", fields={field: "This field is required."}
            )
        return default
    value = payload[field]
    if value is None and not required:
        return None
    if not isinstance(value, str):
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: "Use an ISO 8601 date and time."},
        )
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: "Use an ISO 8601 date and time."},
        ) from exc
    if parsed.tzinfo is None:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: "Include a timezone offset, for example +03:00."},
        )
    return parsed.astimezone(UTC)


def timezone_name(payload: dict, field: str = "timezone", *, default="Africa/Nairobi") -> str:
    value = payload.get(field, default)
    if not isinstance(value, str):
        raise APIError(
            "Please correct the highlighted fields.", fields={field: "Use a valid timezone name."}
        )
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: "Use an IANA timezone such as Africa/Nairobi."},
        ) from exc
    return value


def http_url(payload: dict, field: str, *, default=None):
    value = optional_text(payload, field, maximum=500, default=default)
    if value is None:
        return None
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise APIError(
            "Please correct the highlighted fields.",
            fields={field: "Use a complete http:// or https:// URL."},
        )
    return value
