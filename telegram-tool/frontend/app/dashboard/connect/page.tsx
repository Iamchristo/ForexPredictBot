"use client";

import { ConnectForm } from "@/components/telegram/ConnectForm";
import { SessionStatus } from "@/components/telegram/SessionStatus";
import { Spinner } from "@/components/ui/Spinner";
import { useTelegramSession } from "@/hooks/useTelegramSession";

export default function ConnectPage() {
  const { status, loading, refresh } = useTelegramSession();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-gray-100">Telegram Account</h1>

      {loading && <Spinner />}

      {!loading && status && <SessionStatus status={status} onChange={refresh} />}

      {!loading && status && !status.is_active && <ConnectForm onConnected={refresh} />}
    </div>
  );
}
