PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS time_slot (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 预约时段主键ID
    slot_date DATE NOT NULL, -- 预约日期
    start_time TIME NOT NULL, -- 时段开始时间
    end_time TIME NOT NULL, -- 时段结束时间
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0), -- 最大容纳人数
    booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0), -- 已预约人数
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    CHECK (start_time < end_time),
    CHECK (booked_count <= max_capacity),
    UNIQUE (slot_date, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 店铺活动主键ID
    title TEXT NOT NULL, -- 活动标题
    start_at DATETIME NOT NULL, -- 活动开始时间
    end_at DATETIME NOT NULL, -- 活动结束时间
    promotion_text TEXT NOT NULL, -- 优惠文案
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    CHECK (start_at < end_at)
);

CREATE TABLE IF NOT EXISTS booking (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 预约订单主键ID
    time_slot_id INTEGER NOT NULL, -- 预约时段ID
    customer_name TEXT NOT NULL, -- 预约人姓名
    customer_phone TEXT NOT NULL, -- 预约人手机号
    status TEXT NOT NULL DEFAULT '正常' CHECK (status IN ('正常', '已取消')), -- 预约状态
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (time_slot_id) REFERENCES time_slot(id) ON UPDATE CASCADE ON DELETE RESTRICT
);
