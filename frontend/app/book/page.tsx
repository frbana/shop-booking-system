'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTimeSlots } from '../../hooks/useTimeSlots';
import { requestApi } from '../../utils/api';

type BookOrder = {
  booking_id?: number;
  slot_id?: number;
  name?: string;
  phone?: string;
  status?: string;
  remaining_count?: number;
};

export default function BookPage() {
  const router = useRouter();
  const { timeSlots, loading, errorMsg } = useTimeSlots();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedDate || timeSlots.length === 0) {
      return;
    }

    const initialSlotId = new URLSearchParams(window.location.search).get('slot_id') || '';
    const initialSlot = timeSlots.find((slot) => String(slot.id) === initialSlotId);
    if (initialSlot) {
      setSelectedDate(initialSlot.slot_date);
      setSelectedSlotId(String(initialSlot.id));
      return;
    }

    setSelectedDate(timeSlots[0].slot_date);
  }, [selectedDate, timeSlots]);

  const dates = useMemo(() => {
    return Array.from(new Set(timeSlots.map((slot) => slot.slot_date)));
  }, [timeSlots]);

  const availableSlots = useMemo(() => {
    return timeSlots.filter((slot) => slot.slot_date === selectedDate);
  }, [selectedDate, timeSlots]);

  const selectedSlot = useMemo(() => {
    return timeSlots.find((slot) => String(slot.id) === selectedSlotId);
  }, [selectedSlotId, timeSlots]);

  const nameError = name.trim() ? '' : '请输入姓名';
  const phoneError = /^\d{11}$/.test(phone.trim()) ? '' : '请输入11位数字手机号';
  const canSubmit =
    !loading &&
    !submitting &&
    !nameError &&
    !phoneError &&
    Boolean(selectedSlotId) &&
    Boolean(selectedSlot) &&
    (selectedSlot?.remaining_count ?? 0) > 0;

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    const firstSlot = timeSlots.find((slot) => slot.slot_date === value);
    setSelectedSlotId(firstSlot ? String(firstSlot.id) : '');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      alert('请输入姓名');
      return;
    }
    if (!/^\d{11}$/.test(phone.trim())) {
      alert('请输入11位数字手机号');
      return;
    }
    if (!selectedSlotId) {
      alert('请选择预约时段');
      return;
    }
    if ((selectedSlot?.remaining_count ?? 0) <= 0) {
      alert('该时段已约满');
      return;
    }

    try {
      setSubmitting(true);

      const result = await requestApi<BookOrder>('/api/book-order', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          slot_id: Number(selectedSlotId),
        }),
      });

      alert(`预约成功，订单号：${result.booking_id ?? ''}`);
      router.push('/user');
    } catch (error) {
      alert(error instanceof Error ? error.message : '预约失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page">
      <section className="panel">
        <div className="header">
          <h1>预约到店时段</h1>
          <p>填写预约信息后提交，预约结果可在个人中心查看。</p>
        </div>

        {loading && <div className="state">正在加载预约时段...</div>}
        {!loading && errorMsg && <div className="state error">{errorMsg}</div>}

        {!loading && !errorMsg && timeSlots.length === 0 && (
          <div className="state">暂无可预约时段</div>
        )}

        {!loading && !errorMsg && timeSlots.length > 0 && (
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>预约日期</span>
              <select
                value={selectedDate}
                onChange={(event) => handleDateChange(event.target.value)}
              >
                {dates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>预约时段</span>
              <select
                value={selectedSlotId}
                onChange={(event) => setSelectedSlotId(event.target.value)}
              >
                <option value="">请选择时段</option>
                {availableSlots.map((slot) => (
                  <option
                    key={slot.id}
                    value={slot.id}
                    disabled={slot.remaining_count <= 0}
                  >
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    {slot.remaining_count > 0
                      ? `，剩余 ${slot.remaining_count} 位`
                      : '，已约满'}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>姓名</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="请输入姓名"
                autoComplete="name"
              />
              {name.length > 0 && nameError && <em>{nameError}</em>}
            </label>

            <label className="field">
              <span>手机号</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="请输入11位手机号"
                inputMode="numeric"
                maxLength={11}
                autoComplete="tel"
              />
              {phone.length > 0 && phoneError && <em>{phoneError}</em>}
            </label>

            {selectedSlot && (
              <div className="summary">
                <strong>当前选择</strong>
                <span>
                  {selectedSlot.slot_date} {selectedSlot.start_time.slice(0, 5)} -{' '}
                  {selectedSlot.end_time.slice(0, 5)}
                </span>
                <span>剩余空位：{selectedSlot.remaining_count}</span>
              </div>
            )}

            <div className="actions">
              <button type="submit" className="primary" disabled={!canSubmit}>
                {submitting ? '提交中...' : '提交预约'}
              </button>
              <button type="button" onClick={() => router.push('/')}>
                返回首页
              </button>
              <button type="button" onClick={() => router.push('/user')}>
                个人中心
              </button>
            </div>
          </form>
        )}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 40px 24px;
          background: #f9fafb;
          color: #111827;
        }

        .panel {
          max-width: 720px;
          margin: 0 auto;
          padding: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
        }

        .header {
          margin-bottom: 24px;
        }

        .header h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.2;
        }

        .header p {
          margin: 10px 0 0;
          color: #6b7280;
          font-size: 15px;
        }

        .form {
          display: grid;
          gap: 18px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field span {
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }

        .field input,
        .field select {
          width: 100%;
          min-height: 44px;
          padding: 0 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          outline: none;
        }

        .field input:focus,
        .field select:focus {
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
        }

        .field em {
          color: #b91c1c;
          font-size: 13px;
          font-style: normal;
        }

        .summary {
          display: grid;
          gap: 6px;
          padding: 14px;
          border-radius: 8px;
          background: #f3f4f6;
          color: #374151;
          font-size: 14px;
        }

        .summary strong {
          color: #111827;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 4px;
        }

        .actions button {
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          cursor: pointer;
          font-weight: 600;
        }

        .actions button:hover:not(:disabled) {
          border-color: #111827;
        }

        .actions button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .actions .primary {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }

        .state {
          padding: 28px 18px;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          color: #6b7280;
          text-align: center;
        }

        .state.error {
          border-color: #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        @media (max-width: 640px) {
          .page {
            padding: 28px 16px;
          }

          .panel {
            padding: 22px 16px;
          }

          .header h1 {
            font-size: 26px;
          }

          .actions {
            display: grid;
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
