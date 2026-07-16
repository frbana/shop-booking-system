from datetime import date, datetime, time, timedelta

from app import app
from models import Activity, Booking, TimeSlot, db


def find_or_create_time_slot(slot_date, start_time, end_time, max_capacity):
    slot = TimeSlot.query.filter_by(
        slot_date=slot_date,
        start_time=start_time,
        end_time=end_time,
    ).first()
    if slot:
        return slot

    slot = TimeSlot(
        slot_date=slot_date,
        start_time=start_time,
        end_time=end_time,
        max_capacity=max_capacity,
        booked_count=0,
    )
    db.session.add(slot)
    db.session.flush()
    return slot


def find_or_create_activity(title, start_at, end_at, promotion_text):
    activity = Activity.query.filter_by(title=title).first()
    if activity:
        activity.start_at = start_at
        activity.end_at = end_at
        activity.promotion_text = promotion_text
        return activity

    activity = Activity(
        title=title,
        start_at=start_at,
        end_at=end_at,
        promotion_text=promotion_text,
    )
    db.session.add(activity)
    return activity


def find_or_create_booking(slot, customer_name, customer_phone, status=Booking.STATUS_NORMAL):
    booking = Booking.query.filter_by(
        time_slot_id=slot.id,
        customer_phone=customer_phone,
    ).first()
    if booking:
        booking.customer_name = customer_name
        booking.status = status
        return booking

    booking = Booking(
        time_slot_id=slot.id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        status=status,
    )
    db.session.add(booking)
    return booking


def refresh_booked_counts():
    for slot in TimeSlot.query.all():
        slot.booked_count = Booking.query.filter_by(
            time_slot_id=slot.id,
            status=Booking.STATUS_NORMAL,
        ).count()


def seed():
    today = date.today()
    slot_templates = [
        (time(9, 0), time(10, 0), 6),
        (time(10, 0), time(11, 0), 6),
        (time(11, 0), time(12, 0), 5),
        (time(14, 0), time(15, 0), 8),
        (time(16, 0), time(17, 0), 5),
    ]

    slots = []
    for day_offset in range(1, 31):
        for start_time, end_time, max_capacity in slot_templates:
            slots.append(
                find_or_create_time_slot(
                    today + timedelta(days=day_offset),
                    start_time,
                    end_time,
                    max_capacity,
                )
            )

    now = datetime.utcnow()
    activities = [
        (
            "新客到店体验礼",
            now - timedelta(days=1),
            now + timedelta(days=10),
            "新用户预约到店可享 9 折体验优惠",
        ),
        (
            "周末双人同行优惠",
            now + timedelta(days=2),
            now + timedelta(days=16),
            "周末双人同行到店，第二人立减 20 元",
        ),
        (
            "会员积分加倍日",
            now - timedelta(days=12),
            now - timedelta(days=2),
            "会员到店消费积分双倍累计",
        ),
        (
            "工作日下午茶专场",
            now - timedelta(days=3),
            now + timedelta(days=20),
            "工作日 14:00-17:00 到店预约享饮品半价",
        ),
        (
            "暑期护理套餐",
            now + timedelta(days=5),
            now + timedelta(days=35),
            "预约暑期套餐可获赠一次基础护理服务",
        ),
        (
            "老会员回馈周",
            now + timedelta(days=12),
            now + timedelta(days=19),
            "老会员预约到店可领取专属抵扣券",
        ),
        (
            "限时早鸟预约",
            now - timedelta(days=7),
            now + timedelta(days=7),
            "提前 3 天预约上午时段享 85 折优惠",
        ),
        (
            "节后焕新活动",
            now - timedelta(days=20),
            now - timedelta(days=8),
            "节后到店消费满 199 元减 30 元",
        ),
    ]
    for title, start_at, end_at, promotion_text in activities:
        find_or_create_activity(title, start_at, end_at, promotion_text)

    find_or_create_booking(slots[0], "张三", "13800138000")
    find_or_create_booking(slots[1], "李四", "13900139000")
    find_or_create_booking(slots[2], "王五", "13700137000", Booking.STATUS_CANCELLED)

    refresh_booked_counts()
    db.session.commit()

    print("示例数据已写入")
    print(f"预约时段数量: {TimeSlot.query.count()}")
    print(f"预约订单数量: {Booking.query.count()}")
    print(f"店铺活动数量: {Activity.query.count()}")
    print("个人中心测试手机号: 13800138000")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed()
