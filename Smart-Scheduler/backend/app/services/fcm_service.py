import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return True
    try:
        import firebase_admin
        from firebase_admin import credentials
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "./firebase-service-account.json")
        if not os.path.exists(service_account_path):
            logger.warning(f"Firebase service account file not found: {service_account_path}. FCM disabled.")
            return False
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        return False


def send_push(fcm_token, title, body):
    """Send a push notification via FCM. Returns (success: bool, message_id_or_error: str)"""
    if not fcm_token:
        return False, "No FCM token provided."

    if not _init_firebase():
        return False, "Firebase not initialized."

    try:
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon='/vite.svg'
                )
            ),
            token=fcm_token,
        )
        response = messaging.send(message)
        logger.info(f"FCM sent OK: {response}")
        return True, response
    except Exception as e:
        error_str = str(e)
        logger.error(f"FCM send failed: {error_str}")
        # Handle expired/unregistered token
        if "NOT_FOUND" in error_str or "UNREGISTERED" in error_str:
            return False, "TOKEN_UNREGISTERED"
        return False, error_str
