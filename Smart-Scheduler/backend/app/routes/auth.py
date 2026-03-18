from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from datetime import datetime, timezone
import bcrypt

from ..extensions import db, limiter
from ..models.user import create_user, get_user_by_email, get_user_by_id, serialize_user, update_fcm_token, update_user_password
from ..utils.validators import validate_signup, validate_login

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
@limiter.limit("10 per minute")
def signup():
    data = request.get_json() or {}
    errors = validate_signup(data)
    if errors:
        return jsonify({"errors": errors}), 400

    email = data["email"].lower().strip()
    if get_user_by_email(db, email):
        return jsonify({"errors": {"email": "Email already registered."}}), 409

    password_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt(rounds=12)).decode()
    user_id = create_user(
        db,
        email=email,
        password_hash=password_hash,
        full_name=data["full_name"].strip(),
        account_type=data.get("account_type", "personal"),
        org_name=data.get("org_name"),
        timezone_str=data.get("timezone", "UTC")
    )
    return jsonify({"message": "Account created successfully.", "user_id": user_id}), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json() or {}
    errors = validate_login(data)
    if errors:
        return jsonify({"errors": errors}), 400

    user = get_user_by_email(db, data["email"])
    if not user:
        return jsonify({"errors": {"email": "Invalid email or password."}}), 401

    if not bcrypt.checkpw(data["password"].encode(), user["password_hash"].encode()):
        return jsonify({"errors": {"password": "Invalid email or password."}}), 401

    identity = str(user["_id"])
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": serialize_user(user)
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required(verify_type=False)
def logout():
    jwt_data = get_jwt()
    db.token_blocklist.insert_one({
        "jti": jwt_data["jti"],
        "created_at": datetime.now(timezone.utc)
    })
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.route("/fcm-token", methods=["PUT"])
@jwt_required()
def update_fcm():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    fcm_token = data.get("fcm_token", "").strip()
    if not fcm_token:
        return jsonify({"error": "fcm_token is required."}), 400
    update_fcm_token(db, user_id, fcm_token)
    return jsonify({"message": "FCM token updated."}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = get_user_by_id(db, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": serialize_user(user)}), 200


@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters."}), 400

    user = get_user_by_id(db, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    if not bcrypt.checkpw(current_password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Current password is incorrect."}), 401

    new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
    update_user_password(db, user_id, new_hash)
    return jsonify({"message": "Password changed successfully."}), 200
