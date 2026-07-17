'use client';

import { useEffect, useState } from 'react';
import { PageBanner, StateBox, StatusPill } from '../../components/StyleBlocks';
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

type UserProfile = {
  id: number;
  account: string;
  phone: string;
  avatar: string;
  username: string;
  gender: string;
  birthday: string;
};

type AuthMode = 'login' | 'register';

const defaultUser: UserProfile = {
  id: 0,
  account: '',
  phone: '',
  avatar: '',
  username: '预约用户',
  gender: '未设置',
  birthday: '',
};

export default function UserPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<UserProfile>(defaultUser);
  const [editingProfile, setEditingProfile] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authAccount, setAuthAccount] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const savedUser = window.localStorage.getItem('shop-booking-current-user');
    if (!savedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as UserProfile;
      setCurrentUser(parsedUser);
      setProfileDraft(parsedUser);
    } catch {
      window.localStorage.removeItem('shop-booking-current-user');
    }
  }, []);

  const persistUser = (user: UserProfile) => {
    setCurrentUser(user);
    setProfileDraft(user);
    window.localStorage.setItem('shop-booking-current-user', JSON.stringify(user));
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!authAccount.trim()) {
      alert('请输入账号');
      return;
    }
    if (authPassword.length < 6) {
      alert('密码至少需要6位');
      return;
    }
    if (authMode === 'register' && !/^\d{11}$/.test(authPhone.trim())) {
      alert('请输入11位数字手机号');
      return;
    }

    try {
      setAuthLoading(true);
      setErrorMsg('');

      const user = await requestApi<UserProfile>(
        authMode === 'login' ? '/api/user/login' : '/api/user/register',
        {
          method: 'POST',
          body: JSON.stringify({
            account: authAccount.trim(),
            password: authPassword,
            phone: authPhone.trim(),
            username: authUsername.trim() || authAccount.trim(),
          }),
        },
      );

      persistUser(user);
      setAuthPassword('');
      setSearched(false);
      setOrders([]);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : '操作失败');
    } finally {
      setAuthLoading(false);
    }
  };

  const saveProfileToDb = async (nextProfile: UserProfile) => {
    const savedProfile = await requestApi<UserProfile>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        user_id: nextProfile.id,
        username: nextProfile.username,
        gender: nextProfile.gender,
        birthday: nextProfile.birthday,
        avatar: nextProfile.avatar,
      }),
    });
    persistUser(savedProfile);
    return savedProfile;
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') {
        return;
      }

      try {
        const nextProfile = { ...profileDraft, avatar: reader.result };
        setProfileDraft(nextProfile);
        await saveProfileToDb(nextProfile);
      } catch (error) {
        alert(error instanceof Error ? error.message : '头像保存失败');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveProfile = async () => {
    if (!currentUser) {
      return;
    }

    const nextProfile = {
      ...profileDraft,
      username: profileDraft.username.trim() || defaultUser.username,
    };

    try {
      setSavingProfile(true);
      await saveProfileToDb(nextProfile);
      setEditingProfile(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存用户资料失败');
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelEditProfile = () => {
    if (currentUser) {
      setProfileDraft(currentUser);
    }
    setEditingProfile(false);
  };

  const logout = () => {
    setCurrentUser(null);
    setProfileDraft(defaultUser);
    setOrders([]);
    setSearched(false);
    setEditingProfile(false);
    window.localStorage.removeItem('shop-booking-current-user');
  };

  const fetchOrders = async () => {
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const data = await requestApi<Order[]>(
        `/api/user/order?phone=${encodeURIComponent(currentUser.phone)}`,
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
      await fetchOrders();
    } catch (error) {
      alert(error instanceof Error ? error.message : '取消预约失败');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <main className="page">
      <PageBanner
        title="个人中心"
        description="登录后查看个人资料、管理头像，并查询绑定手机号下的预约记录。"
      />

      {!currentUser ? (
        <section className="authCard" aria-label="登录注册">
          <div className="authTabs">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              登录
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              注册
            </button>
          </div>

          <form className="authForm" onSubmit={handleAuthSubmit}>
            <label className="field">
              <span>账号</span>
              <input
                value={authAccount}
                onChange={(event) => setAuthAccount(event.target.value)}
                placeholder="请输入账号"
                autoComplete="username"
              />
            </label>

            <label className="field">
              <span>密码</span>
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="至少6位密码"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>

            {authMode === 'register' && (
              <>
                <label className="field">
                  <span>手机号</span>
                  <input
                    value={authPhone}
                    onChange={(event) => setAuthPhone(event.target.value)}
                    placeholder="每个账号绑定一个手机号"
                    inputMode="numeric"
                    maxLength={11}
                    autoComplete="tel"
                  />
                </label>

                <label className="field">
                  <span>用户名</span>
                  <input
                    value={authUsername}
                    onChange={(event) => setAuthUsername(event.target.value)}
                    placeholder="默认使用账号名"
                    autoComplete="name"
                  />
                </label>
              </>
            )}

            <button type="submit" className="primaryButton" disabled={authLoading}>
              {authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册并登录'}
            </button>
          </form>

          {errorMsg && <StateBox tone="error" message={errorMsg} />}
        </section>
      ) : (
        <section className="panel">
          <section className="profileCard" aria-label="用户信息">
            <div className="avatarWrap">
              <label className="avatarUploader" aria-label="点击更换头像">
                {profileDraft.avatar ? (
                  <img src={profileDraft.avatar} alt="用户头像" className="avatar" />
                ) : (
                  <span className="avatarFallback" aria-hidden="true">
                    {profileDraft.username.slice(0, 1)}
                  </span>
                )}
                <span className="avatarHint">更换头像</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="profileInfo">
              {editingProfile ? (
                <div className="profileForm">
                  <label className="field">
                    <span>用户名</span>
                    <input
                      value={profileDraft.username}
                      onChange={(event) =>
                        setProfileDraft((currentProfile) => ({
                          ...currentProfile,
                          username: event.target.value,
                        }))
                      }
                      placeholder="请输入用户名"
                    />
                  </label>

                  <label className="field">
                    <span>性别</span>
                    <select
                      value={profileDraft.gender}
                      onChange={(event) =>
                        setProfileDraft((currentProfile) => ({
                          ...currentProfile,
                          gender: event.target.value,
                        }))
                      }
                    >
                      <option value="未设置">未设置</option>
                      <option value="女">女</option>
                      <option value="男">男</option>
                      <option value="其他">其他</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>生日</span>
                    <input
                      type="date"
                      value={profileDraft.birthday}
                      onChange={(event) =>
                        setProfileDraft((currentProfile) => ({
                          ...currentProfile,
                          birthday: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="profileHeader">
                    <div>
                      <h2>{currentUser.username}</h2>
                      <p>账号：{currentUser.account}</p>
                    </div>
                    <StatusPill tone="info">已登录</StatusPill>
                  </div>

                  <div className="profileMeta">
                    <span>绑定手机号：{currentUser.phone}</span>
                    <span>性别：{currentUser.gender}</span>
                    <span>生日：{currentUser.birthday || '未设置'}</span>
                  </div>
                </>
              )}
            </div>

            <div className="profileActions">
              {editingProfile ? (
                <>
                  <button
                    type="button"
                    className="profilePrimary"
                    onClick={saveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? '保存中...' : '保存信息'}
                  </button>
                  <button type="button" onClick={cancelEditProfile}>
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="profilePrimary"
                    onClick={() => setEditingProfile(true)}
                  >
                    编辑信息
                  </button>
                  <button type="button" onClick={logout}>
                    退出登录
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="search">
            <div>
              <strong>预约记录</strong>
              <p>仅查询当前账号绑定手机号：{currentUser.phone}</p>
            </div>
            <button type="button" onClick={fetchOrders} disabled={loading}>
              {loading ? '查询中...' : '查询预约'}
            </button>
          </section>

          {errorMsg && <StateBox tone="error" message={errorMsg} />}

          {!errorMsg && searched && !loading && orders.length === 0 && (
            <StateBox message="暂无预约记录" />
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
                      <StatusPill tone={canceled ? 'danger' : 'success'}>
                        {order.status}
                      </StatusPill>
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
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 44px 24px 64px;
          background: transparent;
          color: var(--text);
        }

        .panel,
        .authCard {
          max-width: 860px;
          margin: 0 auto;
        }

        .authCard {
          display: grid;
          gap: 16px;
          padding: 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background: var(--card);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .authTabs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .authTabs button,
        .primaryButton,
        .search button,
        .cancel {
          min-height: 44px;
          padding: 0 16px;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 800;
          white-space: nowrap;
        }

        .authTabs button {
          background: #f8fafc;
          color: var(--muted);
        }

        .authTabs button.active,
        .primaryButton,
        .search button {
          background: linear-gradient(135deg, var(--primary), var(--teal));
          color: #ffffff;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
        }

        .authForm {
          display: grid;
          gap: 14px;
        }

        .profileCard {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 18px;
          align-items: center;
          margin-bottom: 16px;
          padding: 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background: var(--card);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .avatarWrap {
          display: grid;
          gap: 10px;
          justify-items: center;
        }

        .avatarUploader {
          position: relative;
          display: inline-flex;
          cursor: pointer;
          border-radius: 999px;
        }

        .avatar,
        .avatarFallback {
          width: 86px;
          height: 86px;
          border-radius: 999px;
          border: 3px solid #ffffff;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
        }

        .avatar {
          object-fit: cover;
        }

        .avatarFallback {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary), var(--teal));
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
        }

        .avatarHint {
          position: absolute;
          inset: auto 8px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 24px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.78);
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .avatarUploader:hover .avatarHint,
        .avatarUploader:focus-within .avatarHint {
          opacity: 1;
        }

        .avatarUploader input {
          display: none;
        }

        .profileInfo {
          min-width: 0;
        }

        .profileHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .profileHeader h2 {
          margin: 0;
          color: var(--text);
          font-size: 24px;
          line-height: 1.2;
        }

        .profileHeader p,
        .search p {
          margin: 8px 0 0;
          color: var(--muted);
          font-size: 14px;
        }

        .profileMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
          color: #475569;
          font-size: 14px;
        }

        .profileMeta span {
          padding: 7px 10px;
          border-radius: 8px;
          background: #f8fafc;
        }

        .profileForm {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .profileActions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px;
        }

        .profileActions button {
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: var(--text);
          cursor: pointer;
          font-weight: 800;
          white-space: nowrap;
        }

        .profileActions .profilePrimary {
          border-color: transparent;
          background: linear-gradient(135deg, var(--primary), var(--teal));
          color: #ffffff;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field span {
          color: var(--text);
          font-size: 14px;
          font-weight: 800;
        }

        .field input,
        .field select {
          width: 100%;
          min-height: 44px;
          padding: 0 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.94);
          color: var(--text);
          outline: none;
        }

        .field input:focus,
        .field select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
        }

        .search {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          margin-bottom: 14px;
          padding: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background: var(--card);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .search strong {
          color: var(--text);
          font-size: 16px;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .list {
          display: grid;
          gap: 14px;
        }

        .card {
          display: grid;
          gap: 14px;
          padding: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background: var(--card);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
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
          color: var(--primary-dark);
          font-size: 15px;
          font-weight: 800;
        }

        .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 16px;
          color: #475569;
          font-size: 14px;
        }

        .cancel {
          justify-self: start;
          background: linear-gradient(135deg, var(--rose), #f97316);
          color: #ffffff;
          box-shadow: 0 12px 24px rgba(225, 29, 72, 0.18);
        }

        @media (max-width: 640px) {
          .page {
            padding: 28px 16px;
          }

          .profileCard,
          .search {
            grid-template-columns: 1fr;
            justify-items: stretch;
          }

          .avatarWrap {
            justify-items: start;
          }

          .profileHeader {
            display: grid;
          }

          .profileForm {
            grid-template-columns: 1fr;
          }

          .profileActions {
            justify-content: stretch;
          }

          .profileActions button,
          .search button,
          .cancel {
            width: 100%;
          }

          .cardHeader {
            display: grid;
          }

          .meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
