import logging
import os
from logging.handlers import RotatingFileHandler

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    from .models import Activity, Booking, TimeSlot, db
except ImportError:
    from models import Activity, Booking, TimeSlot, db


def create_app():
    if load_dotenv:
        load_dotenv()

    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "sqlite:///shop_booking.db",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_AS_ASCII"] = False

    db.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}},
        supports_credentials=True,
    )

    configure_logging(app)
    register_routes(app)
    register_error_handlers(app)

    with app.app_context():
        db.create_all()

    return app


def configure_logging(app):
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_dir = os.getenv("LOG_DIR", "logs")
    os.makedirs(log_dir, exist_ok=True)

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s [%(name)s] %(message)s"
    )

    file_handler = RotatingFileHandler(
        os.path.join(log_dir, "app.log"),
        maxBytes=1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(log_level)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)

    app.logger.handlers.clear()
    app.logger.setLevel(log_level)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)


def register_routes(app):
    @app.get("/api/health")
    def health_check():
        return jsonify({"code": 0, "message": "ok", "data": {"status": "healthy"}})

    @app.get("/api/time-slot")
    def get_time_slots():
        try:
            # 按预约日期、开始时间、结束时间升序读取全部预约时段。
            time_slots = (
                TimeSlot.query.order_by(
                    TimeSlot.slot_date.asc(),
                    TimeSlot.start_time.asc(),
                    TimeSlot.end_time.asc(),
                )
                .all()
            )

            data = []
            for slot in time_slots:
                # 剩余可预约人数实时由最大容纳人数减去已预约人数计算，避免冗余存储。
                remaining_count = max(slot.max_capacity - slot.booked_count, 0)
                data.append(
                    {
                        "id": slot.id,
                        "slot_date": slot.slot_date.isoformat(),
                        "start_time": slot.start_time.strftime("%H:%M:%S"),
                        "end_time": slot.end_time.strftime("%H:%M:%S"),
                        "max_capacity": slot.max_capacity,
                        "booked_count": slot.booked_count,
                        "remaining_count": remaining_count,
                    }
                )

            return jsonify({"code": 0, "msg": "查询成功", "data": data})
        except Exception as error:
            app.logger.exception("查询预约时段失败: %s", error)
            return jsonify({"code": 1, "msg": "查询预约时段失败", "data": []}), 500

    @app.get("/api/summary")
    def summary():
        data = {
            "time_slot_count": TimeSlot.query.count(),
            "booking_count": Booking.query.count(),
            "activity_count": Activity.query.count(),
        }
        return jsonify({"code": 0, "message": "success", "data": data})


def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        app.logger.warning(
            "HTTP error %s %s: %s",
            request.method,
            request.path,
            error.description,
        )
        return (
            jsonify(
                {
                    "code": error.code,
                    "message": error.description,
                    "data": None,
                }
            ),
            error.code,
        )

    @app.errorhandler(Exception)
    def handle_exception(error):
        db.session.rollback()
        app.logger.exception(
            "Unhandled error %s %s: %s",
            request.method,
            request.path,
            error,
        )
        return (
            jsonify(
                {
                    "code": 500,
                    "message": "服务器内部错误",
                    "data": None,
                }
            ),
            500,
        )


app = create_app()


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host=host, port=port, debug=debug)
