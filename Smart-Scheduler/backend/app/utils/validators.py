import re
from datetime import datetime, timezone


def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password):
    return len(password) >= 8


def validate_signup(data):
    errors = {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    account_type = data.get("account_type", "personal")

    if not email:
        errors["email"] = "Email is required."
    elif not validate_email(email):
        errors["email"] = "Invalid email format."

    if not password:
        errors["password"] = "Password is required."
    elif not validate_password(password):
        errors["password"] = "Password must be at least 8 characters."

    if not full_name:
        errors["full_name"] = "Full name is required."

    if account_type not in ("personal", "organization"):
        errors["account_type"] = "account_type must be 'personal' or 'organization'."

    if account_type == "organization" and not data.get("org_name", "").strip():
        errors["org_name"] = "Organization name is required for organization accounts."

    return errors


def validate_login(data):
    errors = {}
    if not data.get("email", "").strip():
        errors["email"] = "Email is required."
    if not data.get("password", ""):
        errors["password"] = "Password is required."
    return errors


def validate_reminder(data):
    errors = {}
    title = data.get("title", "").strip()
    remind_at_str = data.get("remind_at", "")
    recurrence = data.get("recurrence", "none")

    if not title:
        errors["title"] = "Title is required."
    elif len(title) > 100:
        errors["title"] = "Title must be 100 characters or fewer."

    if data.get("description") and len(data["description"]) > 500:
        errors["description"] = "Description must be 500 characters or fewer."

    if not remind_at_str:
        errors["remind_at"] = "remind_at is required."
    else:
        try:
            remind_at = datetime.fromisoformat(remind_at_str.replace("Z", "+00:00"))
            if remind_at.tzinfo is None:
                remind_at = remind_at.replace(tzinfo=timezone.utc)
            if remind_at <= datetime.now(timezone.utc):
                errors["remind_at"] = "remind_at must be in the future."
        except ValueError:
            errors["remind_at"] = "remind_at must be a valid ISO 8601 datetime."

    valid_recurrences = ("none", "daily", "weekly", "monthly")
    if recurrence not in valid_recurrences:
        errors["recurrence"] = f"recurrence must be one of {valid_recurrences}."

    tags = data.get("tags", [])
    if isinstance(tags, list) and len(tags) > 5:
        errors["tags"] = "Maximum 5 tags allowed."

    return errors


def parse_remind_at(remind_at_str):
    dt = datetime.fromisoformat(remind_at_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt
