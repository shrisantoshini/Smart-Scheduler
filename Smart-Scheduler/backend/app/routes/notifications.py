from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timezone

from ..extensions import db

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    limit = min(int(request.args.get("limit", 20)), 100)
    offset = int(request.args.get("offset", 0))
    status_filter = request.args.get("status", "all")

    query = {"user_id": ObjectId(user_id)}
    if status_filter != "all":
        query["status"] = status_filter

    total = db.notification_history.count_documents(query)
    cursor = db.notification_history.find(query).sort("sent_at", -1).skip(offset).limit(limit)

    records = []
    for doc in cursor:
        records.append({
            "id": str(doc["_id"]),
            "reminder_id": str(doc.get("reminder_id", "")),
            "title": doc.get("title", ""),
            "sent_at": doc["sent_at"].isoformat() if doc.get("sent_at") else None,
            "status": doc.get("status", ""),
            "fcm_message_id": doc.get("fcm_message_id"),
            "error_message": doc.get("error_message"),
        })

    return jsonify({"history": records, "total": total}), 200


@notifications_bp.route("/status", methods=["GET"])
@jwt_required()
def status():
    user_id = get_jwt_identity()
    uid = ObjectId(user_id)

    total_sent = db.notification_history.count_documents({"user_id": uid, "status": "delivered"})
    total_failed = db.notification_history.count_documents({"user_id": uid, "status": "failed"})
    pending_count = db.reminders.count_documents({"user_id": uid, "status": "pending"})

    last = db.notification_history.find_one(
        {"user_id": uid, "status": "delivered"},
        sort=[("sent_at", -1)]
    )
    last_sent_at = last["sent_at"].isoformat() if last and last.get("sent_at") else None

    return jsonify({
        "total_sent": total_sent,
        "total_failed": total_failed,
        "pending_count": pending_count,
        "last_sent_at": last_sent_at
    }), 200
