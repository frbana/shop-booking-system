# Day2 项目 AI 代码评审

评审范围：`backend/app.py`、`backend/models.py`、`frontend/app/page.tsx`、`frontend/app/book/page.tsx`、`frontend/app/activity/page.tsx`、`frontend/app/user/page.tsx`。

## 1. 代码规范

### 问题 1：后端返回字段不统一

位置：`backend/app.py:23`、`backend/app.py:96`、`backend/app.py:310`

问题：项目大多数接口返回 `code/msg/data`，但 `/api/health` 和 `/api/summary` 使用了 `message`。前端如果统一按 `msg` 读取，会出现提示为空的问题。

优化代码：

```python
def success_response(data=None, msg="操作成功"):
    return jsonify({"code": 0, "msg": msg, "data": data if data is not None else {}})


def error_response(msg="操作失败", data=None, status_code=400):
    return jsonify({"code": 1, "msg": msg, "data": data if data is not None else {}}), status_code


@app.get("/api/health")
def health_check():
    return success_response({"status": "healthy"}, "ok")


@app.get("/api/summary")
def summary():
    data = {
        "time_slot_count": TimeSlot.query.count(),
        "booking_count": Booking.query.count(),
        "activity_count": Activity.query.count(),
    }
    return success_response(data, "查询成功")
```

### 问题 2：前端接口请求代码重复

位置：`frontend/app/page.tsx:22`、`frontend/app/book/page.tsx:35`、`frontend/app/activity/page.tsx:20`、`frontend/app/user/page.tsx:36`

问题：每个页面都定义 `API_BASE_URL` 和 `fetch + json + code` 判断逻辑。后续如果后端返回格式调整，需要改多个文件。

优化代码：新增 `frontend/lib/api.ts`。

```ts
export type ApiResult<T> = {
  code: number;
  msg: string;
  data: T;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export async function requestApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  let result: ApiResult<T>;
  try {
    result = (await response.json()) as ApiResult<T>;
  } catch {
    throw new Error('服务响应格式错误');
  }

  if (!response.ok || result.code !== 0) {
    throw new Error(result.msg || '请求失败');
  }

  return result.data;
}
```

## 2. 业务健壮性

### 问题 3：预约下单存在并发超卖风险

位置：`backend/app.py:152`、`backend/app.py:156`、`backend/app.py:165`

问题：下单逻辑先查剩余人数，再 `booked_count += 1`。如果两个请求同时进入，都可能读到同一个剩余人数，导致超出最大容量。

优化代码：用条件更新保证只有 `booked_count < max_capacity` 时才能占位。

```python
from sqlalchemy import update
from sqlalchemy.exc import SQLAlchemyError


@app.post("/api/book-order")
def create_book_order():
    try:
        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        slot_id = payload.get("slot_id")

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

        existing_booking = Booking.query.filter_by(
            time_slot_id=slot_id,
            customer_phone=phone,
            status=Booking.STATUS_NORMAL,
        ).first()
        if existing_booking:
            return error_response("该手机号已预约此时段", {}, 400)

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
        return success_response(
            {
                "booking_id": booking.id,
                "slot_id": slot_id,
                "name": booking.customer_name,
                "phone": booking.customer_phone,
                "status": booking.status,
                "remaining_count": time_slot.max_capacity - time_slot.booked_count,
            },
            "预约成功",
        )
    except SQLAlchemyError as error:
        db.session.rollback()
        app.logger.exception("创建预约订单数据库异常: %s", error)
        return error_response("预约失败，请稍后重试", {}, 500)
```

### 问题 4：取消订单未校验取消状态之外的非法状态

位置：`backend/app.py:246`

问题：当前只判断 `已取消`，如果未来状态扩展为 `已完成/过期`，接口仍会取消。建议明确只允许 `正常` 订单取消。

优化代码：

```python
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
        if order.time_slot and order.time_slot.booked_count > 0:
            order.time_slot.booked_count -= 1

        db.session.commit()

        return success_response(
            {
                "order_id": order.id,
                "status": order.status,
                "slot_id": order.time_slot_id,
                "remaining_count": order.time_slot.max_capacity - order.time_slot.booked_count,
            },
            "取消成功",
        )
    except SQLAlchemyError as error:
        db.session.rollback()
        app.logger.exception("取消用户订单数据库异常: %s", error)
        return error_response("取消订单失败", {}, 500)
```

## 3. 性能优化

### 问题 5：用户订单查询有 N+1 查询风险

位置：`backend/app.py:204`

问题：`Booking.query.join(TimeSlot)` 不会自动把 `order.time_slot` 预加载到对象上。循环里访问 `order.time_slot` 时可能为每条订单额外查询一次。

优化代码：

```python
from sqlalchemy.orm import joinedload


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

        data = [
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
            for order in orders
        ]

        return success_response(data, "查询成功")
    except SQLAlchemyError as error:
        app.logger.exception("查询用户订单数据库异常: %s", error)
        return error_response("查询订单失败", [], 500)
```

### 问题 6：首页和预约页重复请求时段列表

位置：`frontend/app/page.tsx:30`、`frontend/app/book/page.tsx:49`

问题：首页点击卡片进入预约页后，预约页重新请求完整时段列表。当前规模不大可以接受，但如果时段多，重复请求会增加首屏等待。可以抽成 hook，后续配合缓存或 SWR。

优化代码：新增 `frontend/hooks/useTimeSlots.ts`。

```ts
import { useEffect, useState } from 'react';
import { requestApi } from '../lib/api';

export type TimeSlot = {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_count: number;
  remaining_count: number;
};

export function useTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg('');
        const data = await requestApi<TimeSlot[]>('/api/time-slot');
        if (!ignore) {
          setTimeSlots(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!ignore) {
          setTimeSlots([]);
          setErrorMsg(error instanceof Error ? error.message : '时段加载失败');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  return { timeSlots, loading, errorMsg };
}
```

## 4. 工程规范

### 问题 7：前端生产环境可能误连本地后端

位置：`frontend/app/page.tsx:22`、`frontend/app/book/page.tsx:35`、`frontend/app/activity/page.tsx:20`、`frontend/app/user/page.tsx:36`

问题：`NEXT_PUBLIC_API_BASE_URL` 未配置时默认 `http://localhost:5000`。在 Vercel 生产环境中，这会让用户浏览器请求自己的本机 5000 端口。

优化代码：在 `frontend/lib/api.ts` 中生产环境强校验。

```ts
export type ApiResult<T> = {
  code: number;
  msg: string;
  data: T;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getApiBaseUrl() {
  if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('生产环境缺少 NEXT_PUBLIC_API_BASE_URL');
  }
  return API_BASE_URL || 'http://localhost:5000';
}

export async function requestApi<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: 'no-store',
    ...options,
  });
  const result = (await response.json()) as ApiResult<T>;
  if (!response.ok || result.code !== 0) {
    throw new Error(result.msg || '请求失败');
  }
  return result.data;
}
```

### 问题 8：后端路由函数都集中在 `app.py`，后续维护成本会上升

位置：`backend/app.py:95`

问题：所有 API 都写在一个 `register_routes` 函数中，短期可运行，但后续继续增加管理端、活动管理、订单统计会让 `app.py` 变成大文件。建议逐步拆成 Blueprint。

优化代码：示例 `backend/routes/time_slot.py`。

```python
from flask import Blueprint, current_app
from sqlalchemy.exc import SQLAlchemyError

from backend.models import TimeSlot

time_slot_bp = Blueprint("time_slot", __name__, url_prefix="/api")


def success_response(data=None, msg="操作成功"):
    from flask import jsonify

    return jsonify({"code": 0, "msg": msg, "data": data if data is not None else {}})


def error_response(msg="操作失败", data=None, status_code=400):
    from flask import jsonify

    return jsonify({"code": 1, "msg": msg, "data": data if data is not None else {}}), status_code


@time_slot_bp.get("/time-slot")
def get_time_slots():
    try:
        slots = (
            TimeSlot.query.order_by(
                TimeSlot.slot_date.asc(),
                TimeSlot.start_time.asc(),
                TimeSlot.end_time.asc(),
            )
            .all()
        )
        data = [
            {
                "id": slot.id,
                "slot_date": slot.slot_date.isoformat(),
                "start_time": slot.start_time.strftime("%H:%M:%S"),
                "end_time": slot.end_time.strftime("%H:%M:%S"),
                "max_capacity": slot.max_capacity,
                "booked_count": slot.booked_count,
                "remaining_count": max(slot.max_capacity - slot.booked_count, 0),
            }
            for slot in slots
        ]
        return success_response(data, "查询成功")
    except SQLAlchemyError as error:
        current_app.logger.exception("查询预约时段失败: %s", error)
        return error_response("查询预约时段失败", [], 500)
```

`backend/app.py` 注册代码：

```python
from backend.routes.time_slot import time_slot_bp


def create_app():
    app = Flask(__name__)
    db.init_app(app)
    app.register_blueprint(time_slot_bp)
    return app
```

## 总结

当前项目已经具备完整的前后端闭环，主要问题集中在：后端返回格式不完全统一、下单并发安全不足、用户订单查询存在 N+1 风险、前端请求逻辑重复、线上环境变量缺失时容易误连本地服务。

建议优先处理顺序：

1. 先修复预约下单并发超卖。
2. 统一 `success_response/error_response`。
3. 给订单查询加 `joinedload`。
4. 抽前端 `requestApi`。
5. 后续再拆 Blueprint 和复用 hook。
