'use client';

import { useRouter } from 'next/navigation';
import { useTimeSlots } from '../hooks/useTimeSlots';

export default function HomePage() {
  const router = useRouter();
  const { timeSlots, loading, errorMsg } = useTimeSlots();

  const handleSelectSlot = (slotId: number) => {
    router.push(`/book?slot_id=${slotId}`);
  };

  return (
    <main className="page">
      <section className="header">
        <h1>店铺预约</h1>
        <p>选择合适时段，查看实时剩余空位。</p>
      </section>

      {loading && <div className="state">正在加载预约时段...</div>}

      {!loading && errorMsg && <div className="state error">{errorMsg}</div>}

      {!loading && !errorMsg && timeSlots.length === 0 && (
        <div className="state">暂无可预约时段</div>
      )}

      {!loading && !errorMsg && timeSlots.length > 0 && (
        <section className="grid" aria-label="预约时段列表">
          {timeSlots.map((slot) => {
            const disabled = slot.remaining_count <= 0;

            return (
              <button
                key={slot.id}
                type="button"
                className="card"
                onClick={() => handleSelectSlot(slot.id)}
                disabled={disabled}
                aria-label={`${slot.slot_date} ${slot.start_time} 到 ${slot.end_time}，剩余 ${slot.remaining_count} 个空位`}
              >
                <span className="date">{slot.slot_date}</span>
                <span className="time">
                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                </span>
                <span className={disabled ? 'remaining full' : 'remaining'}>
                  {disabled ? '已约满' : `剩余 ${slot.remaining_count} 位`}
                </span>
              </button>
            );
          })}
        </section>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 40px 24px;
          background: #f9fafb;
          color: #111827;
        }

        .header {
          max-width: 960px;
          margin: 0 auto 24px;
        }

        .header h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
          font-weight: 700;
        }

        .header p {
          margin: 10px 0 0;
          color: #6b7280;
          font-size: 15px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          max-width: 960px;
          margin: 0 auto;
        }

        .card {
          display: flex;
          min-height: 140px;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.15s ease;
        }

        .card:hover:not(:disabled) {
          border-color: #111827;
          box-shadow: 0 10px 24px rgba(17, 24, 39, 0.08);
          transform: translateY(-2px);
        }

        .card:disabled {
          cursor: not-allowed;
          opacity: 0.58;
        }

        .date {
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }

        .time {
          color: #111827;
          font-size: 24px;
          font-weight: 700;
        }

        .remaining {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          font-size: 13px;
          font-weight: 600;
        }

        .remaining.full {
          background: #f3f4f6;
          color: #6b7280;
        }

        .state {
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 20px;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          background: #ffffff;
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

          .header h1 {
            font-size: 26px;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
