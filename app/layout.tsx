import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Change-Life OS｜人生管理作業系統 · Personal Operating System",
  description: "以反願景、90 日主線、深度工作與內容飛輪，建立你的一人公司。Build focus, leverage and a one-person business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body>{children}</body>
    </html>
  );
}
