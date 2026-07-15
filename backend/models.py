import re
from datetime import datetime

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates


db = SQLAlchemy()


class TimeSlot(db.Model):
    __tablename__ = "time_slot"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    slot_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False)
    booked_count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    bookings = db.relationship(
        "Booking",
        back_populates="time_slot",
        cascade="save-update, merge",
        passive_deletes=True,
    )

    __table_args__ = (
        db.CheckConstraint("max_capacity > 0", name="ck_time_slot_max_capacity_positive"),
        db.CheckConstraint("booked_count >= 0", name="ck_time_slot_booked_count_non_negative"),
        db.CheckConstraint("booked_count <= max_capacity", name="ck_time_slot_booked_not_exceed_capacity"),
        db.CheckConstraint("start_time < end_time", name="ck_time_slot_start_before_end"),
        db.UniqueConstraint("slot_date", "start_time", "end_time", name="uq_time_slot_period"),
    )

    @validates("max_capacity", "booked_count")
    def validate_people_count(self, key, value):
        if value is None:
            raise ValueError(f"{key}不能为空")
        if value < 0:
            raise ValueError(f"{key}不能为负数")
        if key == "max_capacity" and value == 0:
            raise ValueError("max_capacity必须大于0")
        return value

    def __repr__(self):
        return (
            f"<TimeSlot id={self.id} date={self.slot_date} "
            f"time={self.start_time}-{self.end_time} "
            f"booked={self.booked_count}/{self.max_capacity}>"
        )


class Activity(db.Model):
    __tablename__ = "activity"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(100), nullable=False)
    start_at = db.Column(db.DateTime, nullable=False)
    end_at = db.Column(db.DateTime, nullable=False)
    promotion_text = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    __table_args__ = (
        db.CheckConstraint("start_at < end_at", name="ck_activity_start_before_end"),
    )

    @validates("start_at", "end_at")
    def validate_activity_time(self, key, value):
        if value is None:
            raise ValueError(f"{key}不能为空")

        start_at = value if key == "start_at" else self.start_at
        end_at = value if key == "end_at" else self.end_at

        if start_at and end_at and end_at <= start_at:
            raise ValueError("活动结束时间必须晚于开始时间")
        return value

    def __repr__(self):
        return (
            f"<Activity id={self.id} title={self.title!r} "
            f"period={self.start_at}-{self.end_at}>"
        )


class Booking(db.Model):
    __tablename__ = "booking"

    STATUS_NORMAL = "正常"
    STATUS_CANCELLED = "已取消"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    time_slot_id = db.Column(
        db.Integer,
        db.ForeignKey("time_slot.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_name = db.Column(db.String(50), nullable=False)
    customer_phone = db.Column(db.String(11), nullable=False)
    status = db.Column(db.String(10), nullable=False, default=STATUS_NORMAL)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    time_slot = db.relationship("TimeSlot", back_populates="bookings")

    __table_args__ = (
        db.CheckConstraint("status IN ('正常', '已取消')", name="ck_booking_status"),
    )

    @validates("customer_phone")
    def validate_customer_phone(self, key, value):
        if not value or not re.fullmatch(r"\d{11}", value):
            raise ValueError("手机号必须为11位数字")
        return value

    @validates("status")
    def validate_status(self, key, value):
        if value not in {self.STATUS_NORMAL, self.STATUS_CANCELLED}:
            raise ValueError("预约状态只能是正常或已取消")
        return value

    def __repr__(self):
        return (
            f"<Booking id={self.id} name={self.customer_name!r} "
            f"phone={self.customer_phone} status={self.status}>"
        )


if __name__ == "__main__":
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///shop_booking.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()
