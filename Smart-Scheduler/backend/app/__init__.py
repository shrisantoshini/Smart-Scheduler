from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import get_config
from .extensions import init_db, jwt, scheduler, limiter


def create_app():
    app = Flask(__name__)
    cfg = get_config()
    app.config.from_object(cfg)

    # Extensions
    CORS(app, resources={r"/api/*": {"origins": app.config["FRONTEND_URL"]}},
         supports_credentials=True)
    jwt.init_app(app)
    limiter.init_app(app)

    # Database
    init_db(app)

    # JWT token blocklist check
    from .extensions import db as mongo_db

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        from .extensions import db
        jti = jwt_payload["jti"]
        token = db.token_blocklist.find_one({"jti": jti})
        return token is not None

    # Blueprints
    from .routes.auth import auth_bp
    from .routes.reminders import reminders_bp
    from .routes.notifications import notifications_bp
    from .routes.settings import settings_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(reminders_bp, url_prefix="/api/reminders")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")

    # Scheduler
    if not scheduler.running:
        scheduler.start()

    return app
