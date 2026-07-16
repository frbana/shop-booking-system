'use client';

import { useState } from 'react';
import { requestApi } from '../../utils/api';

type Order = {
  order_id: number;
  name: string;
  phone: string;
  status: '正常' | '已取消' | string;
  created_at: string;
  slot: {
    slot_id: number;
    slot_date: string;
    start_time: string;
    end_time: string;
  };
};

export default function UserPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const phoneError = phone.trim() && !/^\d{11}$/.test(phone.trim()) ? '请输入11位数字手机号' : '';

  const fetchOrders = async (targetPhone = phone.trim()) => {
    if (!targetPhone) {
      alert('请输入手机号');
      return;
    }

    if (!/^\d{11}$/.test(targetPhone)) {
      alert('请输入11位数字手机号');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const data = await requestApi<Order[]>(
        `/api/user/order?phone=${encodeURIComponent(targetPhone)}`,
      );

      setOrders(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (error) {
      setOrders([]);
      setSearched(true);
      setErrorMsg(error instanceof Error ? error.message : '订单查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchOrders();
  };

  const handleCancel = async (orderId: number) => {
    const confirmed = window.confirm('确认取消该预约吗？');
    if (!confirmed) {
      return;
    }

    try {
      setCancelingId(orderId);

      await requestApi('/api/user/cancel', {
        method: 'PUT',
        body: JSON.stringify({ order_id: orderId }),
      });

      alert('取消成功');
      await fetchOrders(phone.trim());
    } catch (error) {
      alert(error instanceof Error ? error.message : '取消预约失败');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <main className="page">
      <section className="panel">
        <div className="header">
          <h1>个人中心</h1>
          <p>输入手机号查询预约记录，可取消未取消的预约订单。</p>
        </div>

        <form className="search" onSubmit={handleSubmit}>
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
          </label>
          <button type="submit" disabled={loading || Boolean(phoneError)}>
            {loading ? '查询中...' : '查询预约'}
          </button>
        </form>

        {phoneError && <div className="hint">{phoneError}</div>}
        {errorMsg && <div className="state error">{errorMsg}</div>}

        {!errorMsg && searched && !loading && orders.length === 0 && (
          <div className="state">暂无预约记录</div>
        )}

        {!errorMsg && orders.length > 0 && (
          <section className="list" aria-label="预约订单列表">
            {orders.map((order) => {
              const canceled = order.status === '已取消';

              return (
                <article key={order.order_id} className="card">
                  <div className="cardHeader">
                    <div>
                      <h2>{order.slot.slot_date}</h2>
                      <p>
                        {order.slot.start_time.slice(0, 5)} -{' '}
                        {order.slot.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <span className={canceled ? 'status canceled' : 'status normal'}>
                      {order.status}
                    </span>
                  </div>

                  <div className="meta">
                    <span>预约人：{order.name}</span>
                    <span>手机号：{order.phone}</span>
                    <span>订单号：{order.order_id}</span>
                    <span>下单时间：{order.created_at}</span>
                  </div>

                  {!canceled && (
                    <button
                      type="button"
                      className="cancel"
                      onClick={() => handleCancel(order.order_id)}
                      disabled={cancelingId === order.order_id}
                    >
                      {cancelingId === order.order_id ? '取消中...' : '取消预约'}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
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
          max-width: 860px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 22px;
        }

        .header h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }

        .header p {
          margin: 10px 0 0;
          color: #6b7280;
          font-size: 15px;
        }

        .search {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: end;
          margin-bottom: 14px;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
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

        .field input {
          width: 100%;
          min-height: 44px;
          padding: 0 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
        }

        .field input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
        }

        .search button,
        .cancel {
          min-height: 44px;
          padding: 0 16px;
          border: 1px solid #111827;
          border-radius: 8px;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
        }

        .search button:disabled,
        .cancel:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .hint {
          margin-bottom: 14px;
          color: #b91c1c;
          font-size: 14px;
        }

        .list {
          display: grid;
          gap: 14px;
        }

        .card {
          display: grid;
          gap: 14px;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
        }

        .cardHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .cardHeader h2 {
          margin: 0;
          font-size: 20px;
          line-height: 1.3;
        }

        .cardHeader p {
          margin: 6px 0 0;
          color: #374151;
          font-size: 15px;
          font-weight: 600;
        }

        .status {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status.normal {
          background: #ecfdf5;
          color: #047857;
        }

        .status.canceled {
          background: #f3f4f6;
          color: #6b7280;
        }

        .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 16px;
          color: #4b5563;
          font-size: 14px;
        }

        .cancel {
          justify-self: start;
          border-color: #dc2626;
          background: #dc2626;
        }

        .state {
          padding: 32px 18px;
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

          .search {
            grid-template-columns: 1fr;
          }

          .cardHeader {
            display: grid;
          }

          .meta {
            grid-template-columns: 1fr;
          }

          .cancel {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
