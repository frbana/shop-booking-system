'use client';

import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="page">
      <section className="panel">
        <h1>页面不存在</h1>
        <p>当前访问的页面不存在或地址输入有误。</p>
        <Link href="/">返回首页</Link>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          color: var(--text);
        }

        .panel {
          display: grid;
          gap: 14px;
          width: min(100%, 520px);
          padding: 24px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background: var(--card);
          box-shadow: var(--shadow);
        }

        h1,
        p {
          margin: 0;
        }

        p {
          color: var(--muted);
          line-height: 1.6;
        }

        a {
          justify-self: start;
          display: inline-flex;
          align-items: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--primary), var(--teal));
          color: #ffffff;
          font-weight: 800;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
