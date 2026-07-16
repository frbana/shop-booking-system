'use client';

import { useEffect, useState } from 'react';
import { PageBanner, StateBox, StatusPill } from '../../components/StyleBlocks';
import { requestApi } from '../../utils/api';

type Activity = {
  id: number;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  promotion_text: string;
  status: '未开始' | '进行中' | '已结束' | string;
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        setErrorMsg('');

        const data = await requestApi<Activity[]>('/api/activity');
        setActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : '活动加载失败');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const getStatusTone = (status: string) => {
    if (status === '进行中') {
      return 'success';
    }
    if (status === '未开始') {
      return 'info';
    }
    return 'danger';
  };

  return (
    <main className="page">
      <PageBanner title="店铺活动" description="查看当前优惠与活动时间安排。" />

      {loading && <StateBox message="正在加载活动..." />}

      {!loading && errorMsg && <StateBox tone="error" message={errorMsg} />}

      {!loading && !errorMsg && activities.length === 0 && (
        <StateBox title="暂无活动" message="有新的店铺活动时会在这里展示。" />
      )}

      {!loading && !errorMsg && activities.length > 0 && (
        <section className="grid" aria-label="活动列表">
          {activities.map((activity) => (
            <article key={activity.id} className="card">
              <div className="cardHeader">
                <h2>{activity.title}</h2>
                <StatusPill tone={getStatusTone(activity.status)}>
                  {activity.status}
                </StatusPill>
              </div>

              <p className="description">
                {activity.description || activity.promotion_text}
              </p>

              <dl className="meta">
                <div>
                  <dt>开始时间</dt>
                  <dd>{activity.start_at}</dd>
                </div>
                <div>
                  <dt>结束时间</dt>
                  <dd>{activity.end_at}</dd>
                </div>
              </dl>

              <div className="promotion">
                <span>优惠内容</span>
                <strong>{activity.promotion_text}</strong>
              </div>
            </article>
          ))}
        </section>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 44px 24px 64px;
          background: transparent;
          color: var(--text);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          max-width: 960px;
          margin: 0 auto;
        }

        .card {
          display: grid;
          gap: 16px;
          padding: 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background: var(--card);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
        }

        .cardHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .cardHeader h2 {
          margin: 0;
          color: var(--text);
          font-size: 20px;
          line-height: 1.35;
        }

        .description {
          margin: 0;
          min-height: 44px;
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
        }

        .meta {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 14px;
          border-radius: 8px;
          background: linear-gradient(135deg, #f8fafc, #eff6ff);
        }

        .meta div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .meta dt {
          color: var(--muted);
          font-size: 13px;
          white-space: nowrap;
        }

        .meta dd {
          margin: 0;
          color: var(--text);
          font-size: 13px;
          text-align: right;
        }

        .promotion {
          display: grid;
          gap: 6px;
          padding-top: 2px;
        }

        .promotion span {
          color: var(--muted);
          font-size: 13px;
        }

        .promotion strong {
          color: #c2410c;
          font-size: 15px;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .page {
            padding: 28px 16px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .meta div {
            display: grid;
            gap: 4px;
          }

          .meta dd {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}
