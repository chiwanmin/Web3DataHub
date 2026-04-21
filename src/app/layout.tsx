import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web3View · Management Console",
  description:
    "JadePool AI Agent · 多链区块链数据监控与智能分析（出块 / Gas / 网络负载 / 节点 / 告警）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Sidebar />
        <main className="ml-[220px] min-h-screen px-8 py-7">{children}</main>
      </body>
    </html>
  );
}
