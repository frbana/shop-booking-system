'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page">
      <section className="panel">
        <h1>页面加载失败</h1>
        <p>{error.message || '页面暂时无法打开，请稍后重试。'}</p>
        <button type="button" onClick={reset}>
          重新加载
        </button>
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

        button {
          justify-self: start;
          min-height: 42px;
          padding: 0 16px;
          border: 0;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--primary), var(--teal));
          color: #ffffff;
          cursor: pointer;
          font-weight: 800;
        }
      `}</style>
    </main>
  );
}
