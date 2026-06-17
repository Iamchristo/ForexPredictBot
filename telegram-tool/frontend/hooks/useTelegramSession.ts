"use client";

import { useCallback, useEffect, useState } from "react";

import { telegramApi } from "@/lib/api";
import type { SessionStatus } from "@/types";

export function useTelegramSession() {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await telegramApi.status();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
