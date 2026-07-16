import type { ReactNode } from 'react';

type PageBannerProps = {
  title: string;
  description: string;
};

type StateBoxProps = {
  title?: string;
  message: string;
  tone?: 'neutral' | 'error';
};

type StatusPillProps = {
  children: ReactNode;
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
};

export function PageBanner({ title, description }: PageBannerProps) {
  return (
    <section className="banner">
      <h1>{title}</h1>
      <p>{description}</p>

      <style jsx>{`
        .banner {
          display: grid;
          gap: 8px;
          max-width: 960px;
          margin: 0 auto 28px;
          padding: 22px 24px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(249, 115, 22, 0.12));
          box-shadow: var(--shadow);
        }

        h1 {
          margin: 0;
          color: var(--text);
          font-size: 34px;
          line-height: 1.2;
          font-weight: 800;
        }

        p {
          margin: 0;
          color: var(--muted);
          font-size: 15px;
        }

        @media (max-width: 640px) {
          .banner {
            padding: 18px 18px;
          }

          h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </section>
  );
}

export function StateBox({ title, message, tone = 'neutral' }: StateBoxProps) {
  return (
    <div className={`state ${tone}`}>
      {title && <strong>{title}</strong>}
      <span>{message}</span>

      <style jsx>{`
        .state {
          display: grid;
          gap: 8px;
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 20px;
          border: 1px dashed rgba(37, 99, 235, 0.35);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.8);
          color: var(--muted);
          text-align: center;
        }

        .state strong {
          color: var(--text);
          font-size: 18px;
        }

        .state.error {
          border-color: rgba(225, 29, 72, 0.35);
          background: rgba(254, 242, 242, 0.9);
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
}

export function StatusPill({ children, tone = 'neutral' }: StatusPillProps) {
  return (
    <span className={`pill ${tone}`}>
      {children}

      <style jsx>{`
        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .success {
          background: #dcfce7;
          color: #15803d;
        }

        .info {
          background: #dbeafe;
          color: var(--primary-dark);
        }

        .warning {
          background: #ffedd5;
          color: #c2410c;
        }

        .danger {
          background: #fee2e2;
          color: #b91c1c;
        }

        .neutral {
          background: #f1f5f9;
          color: #475569;
        }
      `}</style>
    </span>
  );
}
