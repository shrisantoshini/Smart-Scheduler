import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from ..extensions import scheduler

logger = logging.getLogger(__name__)


def _get_db():
    from ..extensions import db
    return db


def _get_next_occurrence(remind_at, recurrence):
    """Compute next reminder datetime based on recurrence."""
    if recurrence == "daily":
        return remind_at + timedelta(days=1)
    elif recurrence == "weekly":
        return remind_at + timedelta(weeks=1)
    elif recurrence == "monthly":
        # Add roughly 1 month
        month = remind_at.month + 1
        year = remind_at.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        try:
            return remind_at.replace(year=year, month=month)
        except ValueError:
            # Handle end of month edge cases
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            return remind_at.replace(year=year, month=month, day=last_day)
    return None


def send_notification(reminder_id_str):
    """APScheduler job function: fetch reminder and send FCM push."""
    from .fcm_service import send_push

    db = _get_db()
    try:
        reminder = db.reminders.find_one({"_id": ObjectId(reminder_id_str)})
        if not reminder:
            logger.warning(f"Reminder {reminder_id_str} not found. Skipping.")
            return

        if reminder.get("status") != "pending":
            logger.info(f"Reminder {reminder_id_str} status={reminder['status']}. Skipping.")
            return

        user = db.users.find_one({"_id": reminder["user_id"]})
        if not user:
            logger.warning(f"User not found for reminder {reminder_id_str}.")
            return

        fcm_token = user.get("fcm_token")
        title = reminder.get("title", "Reminder")
        body = reminder.get("description", "You have a reminder!")

        success, result = send_push(fcm_token, title, body)

        now = datetime.now(timezone.utc)

        if success:
            db.reminders.update_one(
                {"_id": ObjectId(reminder_id_str)},
                {"$set": {"status": "sent", "updated_at": now}}
            )
            db.notification_history.insert_one({
                "user_id": reminder["user_id"],
                "reminder_id": reminder["_id"],
                "title": title,
                "sent_at": now,
                "status": "delivered",
                "fcm_message_id": result,
                "error_message": None
            })
            logger.info(f"Notification sent for reminder {reminder_id_str}.")
        else:
            db.reminders.update_one(
                {"_id": ObjectId(reminder_id_str)},
                {"$set": {"status": "failed", "updated_at": now}}
            )
            db.notification_history.insert_one({
                "user_id": reminder["user_id"],
                "reminder_id": reminder["_id"],
                "title": title,
                "sent_at": now,
                "status": "failed",
                "fcm_message_id": None,
                "error_message": result
            })
            # Clear stale FCM token
            if result == "TOKEN_UNREGISTERED":
                db.users.update_one(
                    {"_id": reminder["user_id"]},
                    {"$set": {"fcm_token": None}}
                )

        # Handle recurrence — create next occurrence
        recurrence = reminder.get("recurrence", "none")
        if success and recurrence != "none":
            next_remind_at = _get_next_occurrence(reminder["remind_at"], recurrence)
            if next_remind_at:
                new_reminder = {
                    "user_id": reminder["user_id"],
                    "title": reminder["title"],
                    "description": reminder.get("description", ""),
                    "remind_at": next_remind_at,
                    "recurrence": recurrence,
                    "status": "pending",
                    "tags": reminder.get("tags", []),
                    "created_at": now,
                    "updated_at": now
                }
                new_result = db.reminders.insert_one(new_reminder)
                new_id = str(new_result.inserted_id)
                schedule_reminder(new_id, next_remind_at)
                logger.info(f"Recurring reminder created: {new_id} at {next_remind_at}")

    except Exception as e:
        logger.error(f"Error in send_notification({reminder_id_str}): {e}")


def schedule_reminder(reminder_id, remind_at):
    """Schedule a DateTrigger APScheduler job."""
    try:
        # Ensure remind_at is timezone-aware
        if remind_at.tzinfo is None:
            remind_at = remind_at.replace(tzinfo=timezone.utc)
        if scheduler.running:
            scheduler.add_job(
                func=send_notification,
                trigger="date",
                run_date=remind_at,
                args=[str(reminder_id)],
                id=str(reminder_id),
                replace_existing=True,
                misfire_grace_time=3600
            )
            logger.info(f"Scheduled reminder {reminder_id} at {remind_at}")
    except Exception as e:
        logger.error(f"Failed to schedule reminder {reminder_id}: {e}")


def cancel_reminder(reminder_id):
    """Remove an APScheduler job by reminder ID."""
    try:
        if scheduler.running:
            scheduler.remove_job(str(reminder_id))
            logger.info(f"Cancelled scheduler job for reminder {reminder_id}")
    except Exception as e:
        logger.info(f"Job {reminder_id} not found in scheduler (may already be done): {e}")


def reschedule_reminder(reminder_id, new_remind_at):
    """Reschedule an existing job to a new datetime."""
    cancel_reminder(reminder_id)
    schedule_reminder(reminder_id, new_remind_at)
