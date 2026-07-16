'use client';

import { useEffect, useState } from 'react';
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

  const getStatusClassName = (status: string) => {
    if (status === '进行中') {
      return 'tag active';
    }
    if (status === '未开始') {
      return 'tag pending';
    }
    return 'tag ended';
  };

  return (
    <main className="page">
      <section className="header">
        <h1>店铺活动</h1>
        <p>查看当前优惠与活动时间安排。</p>
      </section>

      {loading && <div className="state">正在加载活动...</div>}

      {!loading && errorMsg && <div className="state error">{errorMsg}</div>}

      {!loading && !errorMsg && activities.length === 0 && (
        <div className="state">
          <strong>暂无活动</strong>
          <span>有新的店铺活动时会在这里展示。</span>
        </div>
      )}

      {!loading && !errorMsg && activities.length > 0 && (
        <section className="grid" aria-label="活动列表">
          {activities.map((activity) => (
            <article key={activity.id} className="card">
              <div className="cardHeader">
                <h2>{activity.title}</h2>
                <span className={getStatusClassName(activity.status)}>
                  {activity.status}
                </span>
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
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          max-width: 960px;
          margin: 0 auto;
        }

        .card {
          display: grid;
          gap: 16px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 8px 20px rgba(17, 24, 39, 0.04);
        }

        .cardHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .cardHeader h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          line-height: 1.35;
        }

        .tag {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .tag.active {
          background: #ecfdf5;
          color: #047857;
        }

        .tag.pending {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .tag.ended {
          background: #f3f4f6;
          color: #6b7280;
        }

        .description {
          margin: 0;
          min-height: 44px;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.6;
        }

        .meta {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 14px;
          border-radius: 8px;
          background: #f9fafb;
        }

        .meta div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .meta dt {
          color: #6b7280;
          font-size: 13px;
          white-space: nowrap;
        }

        .meta dd {
          margin: 0;
          color: #111827;
          font-size: 13px;
          text-align: right;
        }

        .promotion {
          display: grid;
          gap: 6px;
          padding-top: 2px;
        }

        .promotion span {
          color: #6b7280;
          font-size: 13px;
        }

        .promotion strong {
          color: #b45309;
          font-size: 15px;
          line-height: 1.5;
        }

        .state {
          display: grid;
          gap: 8px;
          max-width: 960px;
          margin: 0 auto;
          padding: 36px 20px;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #6b7280;
          text-align: center;
        }

        .state strong {
          color: #111827;
          font-size: 18px;
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
