from datetime import datetime, timezone
from bson import ObjectId


def create_reminder(db, user_id, title, description, remind_at, recurrence, tags):
    reminder = {
        "user_id": ObjectId(user_id),
        "title": title,
        "description": description or "",
        "remind_at": remind_at,
        "recurrence": recurrence,
        "status": "pending",
        "tags": tags or [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    result = db.reminders.insert_one(reminder)
    return str(result.inserted_id)


def get_reminder_by_id(db, reminder_id):
    try:
        return db.reminders.find_one({"_id": ObjectId(reminder_id)})
    except Exception:
        return None


def get_reminders_for_user(db, user_id, status_filter=None, limit=20, offset=0):
    query = {"user_id": ObjectId(user_id)}
    if status_filter and status_filter != "all":
        query["status"] = status_filter
    total = db.reminders.count_documents(query)
    cursor = db.reminders.find(query).sort("remind_at", 1).skip(offset).limit(limit)
    return list(cursor), total


def get_upcoming_reminders(db, user_id, limit=10):
    now = datetime.now(timezone.utc)
    query = {"user_id": ObjectId(user_id), "status": "pending", "remind_at": {"$gt": now}}
    cursor = db.reminders.find(query).sort("remind_at", 1).limit(limit)
    return list(cursor)


def update_reminder(db, reminder_id, update_fields):
    update_fields["updated_at"] = datetime.now(timezone.utc)
    db.reminders.update_one({"_id": ObjectId(reminder_id)}, {"$set": update_fields})


def delete_reminder(db, reminder_id):
    db.reminders.update_one(
        {"_id": ObjectId(reminder_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
    )


def get_reminder_stats(db, user_id):
    uid = ObjectId(user_id)
    now = datetime.now(timezone.utc)
    week_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    from datetime import timedelta
    week_ago = now - timedelta(days=7)
    total = db.reminders.count_documents({"user_id": uid})
    this_week = db.reminders.count_documents({"user_id": uid, "created_at": {"$gte": week_ago}})
    pending = db.reminders.count_documents({"user_id": uid, "status": "pending"})
    return {"total": total, "this_week": this_week, "pending": pending}


def serialize_reminder(r):
    if not r:
        return None
    return {
        "id": str(r["_id"]),
        "user_id": str(r["user_id"]),
        "title": r["title"],
        "description": r.get("description", ""),
        "remind_at": r["remind_at"].isoformat() if r.get("remind_at") else None,
        "recurrence": r.get("recurrence", "none"),
        "status": r.get("status", "pending"),
        "tags": r.get("tags", []),
        "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        "updated_at": r["updated_at"].isoformat() if r.get("updated_at") else None,
    }
