"use client";

import Link from "next/link";

import { SessionStatus } from "@/components/telegram/SessionStatus";
import { useTelegramSession } from "@/hooks/useTelegramSession";

export default function DashboardHome() {
  const { status, refresh } = useTelegramSession();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-100">Overview</h1>

      {status && <SessionStatus status={status} onChange={refresh} />}

      {status && !status.is_active && (
        <div className="glass rounded-lg p-4 text-sm text-gray-400">
          Connect your Telegram account to start scraping and sending messages.{" "}
          <Link href="/dashboard/connect" className="text-accent">
            Connect now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/scraper" className="glass rounded-lg p-6 hover:bg-[#161b27]">
          <h2 className="font-medium text-gray-100">Scraper</h2>
          <p className="text-sm text-gray-400 mt-1">
            Scrape members from any group or channel you belong to.
          </p>
        </Link>
        <Link href="/dashboard/sender" className="glass rounded-lg p-6 hover:bg-[#161b27]">
          <h2 className="font-medium text-gray-100">Bulk Messenger</h2>
          <p className="text-sm text-gray-400 mt-1">
            Upload a CSV or use scraped members to send bulk messages.
          </p>
        </Link>
      </div>
    </div>
  );
}
