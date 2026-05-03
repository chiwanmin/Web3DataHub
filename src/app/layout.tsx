import type { Metadata } from "next";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web3View · Management Console",
  description:
    "多链区块链数据监控与智能分析（出块 / Gas / 网络负载 / 节点 / 告警）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <Sidebar />
          <main className="lg:ml-[200px] min-h-screen px-4 sm:px-6 lg:px-8 pt-14 lg:pt-7 pb-7">
            <Suspense>{children}</Suspense>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
