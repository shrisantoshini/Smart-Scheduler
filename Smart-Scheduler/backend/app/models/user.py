from datetime import datetime, timezone
from bson import ObjectId


def create_user(db, email, password_hash, full_name, account_type, org_name=None, timezone_str="UTC"):
    user = {
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "account_type": account_type,
        "org_name": org_name if account_type == "organization" else None,
        "full_name": full_name,
        "fcm_token": None,
        "timezone": timezone_str,
        "notification_prefs": {
            "email_enabled": False,
            "push_enabled": True,
            "default_advance_minutes": 0
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    result = db.users.insert_one(user)
    return str(result.inserted_id)


def get_user_by_email(db, email):
    return db.users.find_one({"email": email.lower().strip()})


def get_user_by_id(db, user_id):
    try:
        return db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def update_fcm_token(db, user_id, fcm_token):
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"fcm_token": fcm_token, "updated_at": datetime.now(timezone.utc)}}
    )


def update_user_settings(db, user_id, timezone_str, notification_prefs):
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "timezone": timezone_str,
            "notification_prefs": notification_prefs,
            "updated_at": datetime.now(timezone.utc)
        }}
    )


def update_user_password(db, user_id, new_hash):
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
    )


def delete_user(db, user_id):
    db.users.delete_one({"_id": ObjectId(user_id)})


def serialize_user(user):
    if not user:
        return None
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "account_type": user["account_type"],
        "org_name": user.get("org_name"),
        "timezone": user.get("timezone", "UTC"),
        "notification_prefs": user.get("notification_prefs", {}),
        "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
    }
