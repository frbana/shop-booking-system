'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: '/', label: '首页' },
  { href: '/book', label: '预约' },
  { href: '/activity', label: '活动' },
  { href: '/user', label: '个人中心' },
];

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="nav" aria-label="全局导航">
      <Link href="/" className="brand" aria-label="返回首页">
        店铺预约系统
      </Link>

      <div className="links">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`link${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          min-height: 64px;
          padding: 0 24px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(16px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.08);
        }

        .brand {
          flex: 0 0 auto;
          color: #000000;
          font-size: 30px;
          font-weight: 900;
          line-height: 1;
          text-decoration: none;
          white-space: nowrap;
        }

        .links {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 14px;
          border-radius: 8px;
          color: var(--muted);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition:
            background-color 0.15s ease,
            color 0.15s ease,
            box-shadow 0.15s ease;
          white-space: nowrap;
        }

        .link:hover {
          background: #eff6ff;
          color: var(--primary-dark);
        }

        .link.active {
          background: linear-gradient(135deg, var(--primary), var(--teal));
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.22);
        }

        @media (max-width: 640px) {
          .nav {
            align-items: stretch;
            flex-direction: column;
            gap: 10px;
            min-height: auto;
            padding: 12px 16px;
          }

          .brand {
            font-size: 24px;
          }

          .links {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px;
            width: 100%;
          }

          .link {
            min-height: 36px;
            padding: 0 6px;
            font-size: 13px;
          }
        }
      `}</style>
    </nav>
  );
}
