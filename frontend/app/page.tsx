'use client';

import { useRouter } from 'next/navigation';
import { PageBanner, StateBox, StatusPill } from '../components/StyleBlocks';
import { useTimeSlots } from '../hooks/useTimeSlots';

export default function HomePage() {
  const router = useRouter();
  const { timeSlots, loading, errorMsg } = useTimeSlots();

  const handleSelectSlot = (slotId: number) => {
    router.push(`/book?slot_id=${slotId}`);
  };

  return (
    <main className="page">
      <PageBanner title="店铺预约" description="选择合适时段，查看实时剩余空位。" />

      {loading && <StateBox message="正在加载预约时段..." />}

      {!loading && errorMsg && <StateBox tone="error" message={errorMsg} />}

      {!loading && !errorMsg && timeSlots.length === 0 && (
        <StateBox message="暂无可预约时段" />
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
                <StatusPill tone={disabled ? 'danger' : 'success'}>
                  {disabled ? '已约满' : `剩余 ${slot.remaining_count} 位`}
                </StatusPill>
              </button>
            );
          })}
        </section>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 44px 24px 64px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0)),
            transparent;
          color: var(--text);
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
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9)),
            #ffffff;
          color: inherit;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.15s ease;
        }

        .card:hover:not(:disabled) {
          border-color: rgba(37, 99, 235, 0.45);
          box-shadow: 0 18px 36px rgba(37, 99, 235, 0.16);
          transform: translateY(-3px);
        }

        .card:disabled {
          cursor: not-allowed;
          opacity: 0.58;
        }

        .date {
          color: var(--teal);
          font-size: 14px;
          font-weight: 800;
        }

        .time {
          color: var(--text);
          font-size: 24px;
          font-weight: 800;
        }

        @media (max-width: 640px) {
          .page {
            padding: 28px 16px 48px;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
