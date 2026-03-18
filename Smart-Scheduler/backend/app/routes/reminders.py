from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone

from ..extensions import db
from ..models.reminder import (
    create_reminder, get_reminder_by_id, get_reminders_for_user,
    get_upcoming_reminders, update_reminder, delete_reminder,
    get_reminder_stats, serialize_reminder
)
from ..utils.validators import validate_reminder, parse_remind_at
from ..services.scheduler_service import schedule_reminder, cancel_reminder, reschedule_reminder

reminders_bp = Blueprint("reminders", __name__)


@reminders_bp.route("", methods=["GET"])
@jwt_required()
def list_reminders():
    user_id = get_jwt_identity()
    status_filter = request.args.get("status", "all")
    limit = min(int(request.args.get("limit", 20)), 100)
    offset = int(request.args.get("offset", 0))
    reminders, total = get_reminders_for_user(db, user_id, status_filter, limit, offset)
    return jsonify({
        "reminders": [serialize_reminder(r) for r in reminders],
        "total": total
    }), 200


@reminders_bp.route("/upcoming", methods=["GET"])
@jwt_required()
def upcoming():
    user_id = get_jwt_identity()
    reminders = get_upcoming_reminders(db, user_id, limit=10)
    return jsonify({"reminders": [serialize_reminder(r) for r in reminders]}), 200


@reminders_bp.route("", methods=["POST"])
@jwt_required()
def create():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    errors = validate_reminder(data)
    if errors:
        return jsonify({"errors": errors}), 400

    remind_at = parse_remind_at(data["remind_at"])
    reminder_id = create_reminder(
        db,
        user_id=user_id,
        title=data["title"].strip(),
        description=data.get("description", "").strip(),
        remind_at=remind_at,
        recurrence=data.get("recurrence", "none"),
        tags=data.get("tags", [])
    )
    schedule_reminder(reminder_id, remind_at)
    return jsonify({"reminder_id": reminder_id, "message": "Reminder created and scheduled."}), 201


@reminders_bp.route("/<reminder_id>", methods=["GET"])
@jwt_required()
def get_one(reminder_id):
    user_id = get_jwt_identity()
    reminder = get_reminder_by_id(db, reminder_id)
    if not reminder or str(reminder["user_id"]) != user_id:
        return jsonify({"error": "Reminder not found."}), 404
    return jsonify(serialize_reminder(reminder)), 200


@reminders_bp.route("/<reminder_id>", methods=["PUT"])
@jwt_required()
def update(reminder_id):
    user_id = get_jwt_identity()
    reminder = get_reminder_by_id(db, reminder_id)
    if not reminder or str(reminder["user_id"]) != user_id:
        return jsonify({"error": "Reminder not found."}), 404

    data = request.get_json() or {}
    update_fields = {}

    if "title" in data:
        title = data["title"].strip()
        if not title or len(title) > 100:
            return jsonify({"error": "Title must be 1-100 characters."}), 400
        update_fields["title"] = title

    if "description" in data:
        update_fields["description"] = data["description"].strip()

    if "recurrence" in data:
        update_fields["recurrence"] = data["recurrence"]

    if "tags" in data:
        update_fields["tags"] = data["tags"]

    new_remind_at = None
    if "remind_at" in data:
        errors = validate_reminder({"title": data.get("title", reminder["title"]), **data})
        if "remind_at" in errors:
            return jsonify({"errors": errors}), 400
        new_remind_at = parse_remind_at(data["remind_at"])
        update_fields["remind_at"] = new_remind_at
        update_fields["status"] = "pending"

    update_reminder(db, reminder_id, update_fields)

    if new_remind_at:
        reschedule_reminder(reminder_id, new_remind_at)

    updated = get_reminder_by_id(db, reminder_id)
    return jsonify(serialize_reminder(updated)), 200


@reminders_bp.route("/<reminder_id>", methods=["DELETE"])
@jwt_required()
def delete(reminder_id):
    user_id = get_jwt_identity()
    reminder = get_reminder_by_id(db, reminder_id)
    if not reminder or str(reminder["user_id"]) != user_id:
        return jsonify({"error": "Reminder not found."}), 404

    delete_reminder(db, reminder_id)
    cancel_reminder(reminder_id)
    return jsonify({"message": "Reminder cancelled."}), 200


@reminders_bp.route("/stats/summary", methods=["GET"])
@jwt_required()
def stats():
    user_id = get_jwt_identity()
    data = get_reminder_stats(db, user_id)
    return jsonify(data), 200
