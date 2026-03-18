from pymongo import MongoClient
from flask_jwt_extended import JWTManager
from apscheduler.schedulers.background import BackgroundScheduler
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

client = None
db = None
jwt = JWTManager()
scheduler = BackgroundScheduler(timezone="UTC")
limiter = Limiter(key_func=get_remote_address)


def init_db(app):
    global client, db
    client = MongoClient(app.config["MONGODB_URI"])
    db = client.get_default_database()

    # Indexes
    db.users.create_index("email", unique=True)
    db.reminders.create_index("user_id")
    db.reminders.create_index("remind_at")
    db.reminders.create_index("status")
    db.notification_history.create_index("user_id")
    db.notification_history.create_index([("sent_at", 1)], expireAfterSeconds=7776000)

    return db
