import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Change-Life OS｜將人生變成一場值得玩嘅遊戲",
  description: "用反願景、90 日主線、深度工作同內容飛輪，建立你嘅一人公司作業系統。",
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
