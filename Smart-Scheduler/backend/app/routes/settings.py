from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.user import get_user_by_id, update_user_settings, serialize_user

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("", methods=["GET"])
@jwt_required()
def get_settings():
    user_id = get_jwt_identity()
    user = get_user_by_id(db, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "timezone": user.get("timezone", "UTC"),
        "notification_prefs": user.get("notification_prefs", {
            "email_enabled": False,
            "push_enabled": True,
            "default_advance_minutes": 0
        }),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "account_type": user.get("account_type", "personal"),
        "org_name": user.get("org_name"),
    }), 200


@settings_bp.route("", methods=["PUT"])
@jwt_required()
def put_settings():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    timezone_str = data.get("timezone", "UTC")
    notification_prefs = data.get("notification_prefs", {
        "email_enabled": False,
        "push_enabled": True,
        "default_advance_minutes": 0
    })

    update_user_settings(db, user_id, timezone_str, notification_prefs)
    return jsonify({"message": "Settings updated successfully."}), 200
