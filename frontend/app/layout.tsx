import type { Metadata } from 'next';
import Nav from '../components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: '店铺预约系统',
  description: '店铺预约系统前端',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
