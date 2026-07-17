import logging
import os
import re
from datetime import datetime
from logging.handlers import RotatingFileHandler

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    from .models import Activity, Booking, TimeSlot, User, db
except ImportError:
    from models import Activity, Booking, TimeSlot, User, db


def success_response(data=None, msg="操作成功"):
    return jsonify({"code": 0, "msg": msg, "data": data if data is not None else {}})


def error_response(msg="操作失败", data=None, status_code=400):
    return jsonify({"code": 1, "msg": msg, "data": data if data is not None else {}}), status_code


def serialize_user(user):
    return {
        "id": user.id,
        "account": user.account,
        "phone": user.phone,
        "username": user.username,
        "gender": user.gender,
        "birthday": user.birthday.isoformat() if user.birthday else "",
        "avatar": user.avatar or "",
    }


def parse_birthday(value):
    if not value:
        return None
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        raise ValueError("生日格式必须为YYYY-MM-DD")


def create_app():
    if load_dotenv:
        load_dotenv()

    app = Flask(__name__)
    app_env = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "sqlite:///shop_booking.db",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_AS_ASCII"] = False
    app.config["APP_ENV"] = app_env

    db.init_app(app)
    allowed_origins = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,https://shop-booking-system.vercel.app",
        ).split(",")
        if origin.strip()
    ]
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    configure_logging(app)
    register_routes(app)
    register_error_handlers(app)

    with app.app_context():
        db.create_all()

    return app


def configure_logging(app):
    is_production = app.config["APP_ENV"] == "production"
    log_level = logging.INFO if is_production else logging.DEBUG
    formatter = logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")
    app.logger.handlers.clear()
    app.logger.setLevel(log_level)

    if is_production:
        log_dir = os.getenv("LOG_DIR", "logs")
        os.makedirs(log_dir, exist_ok=True)
        handler = RotatingFileHandler(
            os.path.join(log_dir, "app.log"),
            maxBytes=1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
    else:
        handler = logging.StreamHandler()

    handler.setFormatter(formatter)
    handler.setLevel(log_level)
    app.logger.addHandler(handler)


def register_routes(app):
    @app.get("/api/health")
    def health_check():
        return success_response({"status": "healthy"}, "ok")

    @app.post("/api/user/register")
    def register_user():
        try:
            payload = request.get_json(silent=True) or {}
            account = str(payload.get("account", "")).strip()
            password = str(payload.get("password", ""))
            phone = str(payload.get("phone", "")).strip()
            username = str(payload.get("username", "")).strip() or account

            if not account:
                return error_response("账号不能为空", {}, 400)
            if len(password) < 6:
                return error_response("密码至少需要6位", {}, 400)
            if not re.fullmatch(r"\d{11}", phone):
                return error_response("手机号必须为11位数字", {}, 400)
            if User.query.filter_by(account=account).first():
                return error_response("账号已存在", {}, 400)
            if User.query.filter_by(phone=phone).first():
                return error_response("该手机号已绑定其他账号", {}, 400)

            user = User(
                account=account,
                password_hash=generate_password_hash(password),
                phone=phone,
                username=username,
                gender="未设置",
                birthday=None,
                avatar="",
            )
            db.session.add(user)
            db.session.commit()
            db.session.refresh(user)
            return success_response(serialize_user(user), "注册成功")
        except SQLAlchemyError as error:
            db.session.rollback()
            app.logger.exception("用户注册数据库异常: %s", error)
            return error_response("注册失败，请稍后重试", {}, 500)

    @app.post("/api/user/login")
    def login_user():
        try:
            payload = request.get_json(silent=True) or {}
            account = str(payload.get("account", "")).strip()
            password = str(payload.get("password", ""))

            if not account:
                return error_response("账号不能为空", {}, 400)
            if not password:
                return error_response("密码不能为空", {}, 400)

            user = User.query.filter_by(account=account).first()
            if not user or not check_password_hash(user.password_hash, password):
                return error_response("账号或密码错误", {}, 401)

            return success_response(serialize_user(user), "登录成功")
        except SQLAlchemyError as error:
            app.logger.exception("用户登录数据库异常: %s", error)
            return error_response("登录失败，请稍后重试", {}, 500)

    @app.put("/api/user/profile")
    def update_user_profile():
        try:
            payload = request.get_json(silent=True) or {}
            user_id = payload.get("user_id")
            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                return error_response("用户ID参数错误", {}, 400)

            user = db.session.get(User, user_id)
            if not user:
                return error_response("用户不存在", {}, 404)

            username = str(payload.get("username", user.username)).strip()
            gender = str(payload.get("gender", user.gender)).strip() or "未设置"
            birthday_value = payload.get("birthday", user.birthday.isoformat() if user.birthday else "")
            avatar = str(payload.get("avatar", user.avatar or ""))

            if not username:
                return error_response("用户名不能为空", {}, 400)
            if gender not in {"未设置", "女", "男", "其他"}:
                return error_response("性别参数错误", {}, 400)

            try:
                birthday = parse_birthday(birthday_value)
            except ValueError as error:
                return error_response(str(error), {}, 400)

            user.username = username
            user.gender = gender
            user.birthday = birthday
            user.avatar = avatar
            db.session.commit()

            return success_response(serialize_user(user), "保存成功")
        except SQLAlchemyError as error:
            db.session.rollback()
            app.logger.exception("保存用户资料数据库异常: %s", error)
            return error_response("保存用户资料失败", {}, 500)

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

            return success_response(data, "查询成功")
        except SQLAlchemyError as error:
            app.logger.exception("查询预约时段失败: %s", error)
            return error_response("查询预约时段失败", [], 500)

    @app.post("/api/book-order")
    def create_book_order():
        try:
            payload = request.get_json(silent=True) or {}
            name = str(payload.get("name", "")).strip()
            phone = str(payload.get("phone", "")).strip()
            slot_id = payload.get("slot_id")

            # 校验预约人姓名、手机号和预约时段入参。
            if not name:
                return error_response("姓名不能为空", {}, 400)
            if not re.fullmatch(r"\d{11}", phone):
                return error_response("手机号必须为11位数字", {}, 400)
            try:
                slot_id = int(slot_id)
            except (TypeError, ValueError):
                return error_response("预约时段参数错误", {}, 400)

            time_slot = db.session.get(TimeSlot, slot_id)
            if not time_slot:
                return error_response("预约时段不存在", {}, 404)

            # 同一手机号在同一时段只能保留一笔正常预约。
            existing_booking = Booking.query.filter_by(
                time_slot_id=slot_id,
                customer_phone=phone,
                status=Booking.STATUS_NORMAL,
            ).first()
            if existing_booking:
                return error_response("该手机号已预约此时段", {}, 400)

            # 条件更新保证只有剩余人数大于0时才占位，降低并发超卖风险。
            updated = db.session.execute(
                update(TimeSlot)
                .where(TimeSlot.id == slot_id)
                .where(TimeSlot.booked_count < TimeSlot.max_capacity)
                .values(booked_count=TimeSlot.booked_count + 1)
            )
            if updated.rowcount != 1:
                db.session.rollback()
                return error_response("该时段已约满", {}, 400)

            booking = Booking(
                time_slot_id=slot_id,
                customer_name=name,
                customer_phone=phone,
                status=Booking.STATUS_NORMAL,
            )

            db.session.add(booking)
            db.session.commit()
            db.session.refresh(booking)
            time_slot = db.session.get(TimeSlot, slot_id)

            data = {
                "booking_id": booking.id,
                "slot_id": slot_id,
                "name": booking.customer_name,
                "phone": booking.customer_phone,
                "status": booking.status,
                "remaining_count": time_slot.max_capacity - time_slot.booked_count,
            }
            return success_response(data, "预约成功")
        except SQLAlchemyError as error:
            db.session.rollback()
            app.logger.exception("创建预约订单数据库异常: %s", error)
            return error_response("预约失败，请稍后重试", {}, 500)

    @app.get("/api/user/order")
    def get_user_orders():
        try:
            phone = request.args.get("phone", "").strip()
            if not phone:
                return error_response("手机号不能为空", [], 400)
            if not re.fullmatch(r"\d{11}", phone):
                return error_response("手机号必须为11位数字", [], 400)

            orders = (
                Booking.query.options(joinedload(Booking.time_slot))
                .filter(Booking.customer_phone == phone)
                .order_by(Booking.created_at.desc())
                .all()
            )

            data = []
            for order in orders:
                data.append(
                    {
                        "order_id": order.id,
                        "name": order.customer_name,
                        "phone": order.customer_phone,
                        "status": order.status,
                        "created_at": order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        "slot": {
                            "slot_id": order.time_slot.id,
                            "slot_date": order.time_slot.slot_date.isoformat(),
                            "start_time": order.time_slot.start_time.strftime("%H:%M:%S"),
                            "end_time": order.time_slot.end_time.strftime("%H:%M:%S"),
                        },
                    }
                )

            return success_response(data, "查询成功")
        except SQLAlchemyError as error:
            app.logger.exception("查询用户订单数据库异常: %s", error)
            return error_response("查询订单失败", [], 500)

    @app.put("/api/user/cancel")
    def cancel_user_order():
        try:
            payload = request.get_json(silent=True) or {}
            order_id = payload.get("order_id", request.args.get("order_id"))
            if order_id in (None, ""):
                return error_response("订单ID不能为空", {}, 400)
            try:
                order_id = int(order_id)
            except (TypeError, ValueError):
                return error_response("订单ID参数错误", {}, 400)

            order = db.session.get(Booking, order_id)
            if not order:
                return error_response("订单不存在", {}, 404)
            if order.status != Booking.STATUS_NORMAL:
                return error_response("仅正常订单可取消", {}, 400)

            order.status = Booking.STATUS_CANCELLED
            if order.time_slot.booked_count > 0:
                order.time_slot.booked_count -= 1

            db.session.commit()

            data = {
                "order_id": order.id,
                "status": order.status,
                "slot_id": order.time_slot_id,
                "remaining_count": order.time_slot.max_capacity - order.time_slot.booked_count,
            }
            return success_response(data, "取消成功")
        except SQLAlchemyError as error:
            db.session.rollback()
            app.logger.exception("取消用户订单数据库异常: %s", error)
            return error_response("取消订单失败", {}, 500)

    @app.get("/api/activity")
    def get_activities():
        try:
            page = request.args.get("page", 1, type=int)
            size = request.args.get("size", 10, type=int)
            page = max(page, 1)
            size = min(max(size, 1), 100)

            pagination = Activity.query.order_by(Activity.end_at.desc()).paginate(
                page=page,
                per_page=size,
                error_out=False,
            )

            now = datetime.utcnow()
            data = []
            for activity in pagination.items:
                if now < activity.start_at:
                    status = "未开始"
                elif now <= activity.end_at:
                    status = "进行中"
                else:
                    status = "已结束"

                data.append(
                    {
                        "id": activity.id,
                        "title": activity.title,
                        "start_at": activity.start_at.strftime("%Y-%m-%d %H:%M:%S"),
                        "end_at": activity.end_at.strftime("%Y-%m-%d %H:%M:%S"),
                        "promotion_text": activity.promotion_text,
                        "status": status,
                    }
                )

            return success_response(data, "查询成功")
        except SQLAlchemyError as error:
            app.logger.exception("查询活动列表数据库异常: %s", error)
            return error_response("查询活动失败", [], 500)

    @app.get("/api/summary")
    def summary():
        data = {
            "time_slot_count": TimeSlot.query.count(),
            "booking_count": Booking.query.count(),
            "activity_count": Activity.query.count(),
        }
        return success_response(data, "查询成功")


def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        app.logger.warning(
            "HTTP error %s %s: %s",
            request.method,
            request.path,
            error.description,
        )
        return error_response(error.description, {}, error.code)

    @app.errorhandler(Exception)
    def handle_exception(error):
        db.session.rollback()
        app.logger.exception(
            "Unhandled error %s %s: %s",
            request.method,
            request.path,
            error,
        )
        return error_response("服务器内部错误", {}, 500)


app = create_app()


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host=host, port=port, debug=debug)
