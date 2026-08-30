from flask import Flask, jsonify

from .config import Config
from .errors import register_error_handlers, register_jwt_error_handlers
from .extensions import cors, db, jwt, migrate
from .routes import agenda_bp, auth_bp, bookings_bp, events_bp, health_bp
from .seed import seed_command


def create_app(config: dict | None = None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    )

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(agenda_bp)
    app.register_blueprint(bookings_bp)
    app.cli.add_command(seed_command)
    register_error_handlers(app)
    register_jwt_error_handlers(jwt)

    @app.get("/api")
    def api_index():
        return jsonify(
            {
                "data": {
                    "name": "Hackaform API",
                    "version": "3.0.0",
                    "health": "/api/health",
                }
            }
        )

    return app
