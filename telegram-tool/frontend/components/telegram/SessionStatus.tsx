"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { telegramApi } from "@/lib/api";
import type { SessionStatus as SessionStatusType } from "@/types";

export function SessionStatus({
  status,
  onChange,
}: {
  status: SessionStatusType;
  onChange: () => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Disconnect your Telegram account? You'll need to verify by OTP again.")) {
      return;
    }
    setDisconnecting(true);
    try {
      await telegramApi.disconnect();
      onChange();
    } finally {
      setDisconnecting(false);
    }
  }

  if (!status.is_active) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <span className="h-2.5 w-2.5 rounded-full bg-danger" />
        Not connected
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between glass rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-success" />
        <span className="text-gray-200">
          {status.tg_first_name || "Connected"}
          {status.tg_username && <span className="text-gray-500"> (@{status.tg_username})</span>}
        </span>
      </div>
      <Button variant="danger" onClick={handleDisconnect} disabled={disconnecting}>
        {disconnecting ? "Disconnecting..." : "Disconnect"}
      </Button>
    </div>
  );
}
