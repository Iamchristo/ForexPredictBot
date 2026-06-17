"use client";

import { useEffect, useRef, useState } from "react";

import { tokenStorage } from "@/lib/auth";
import type { CampaignProgress } from "@/types";

export function useSSE(url: string | null) {
  const [data, setData] = useState<CampaignProgress | null>(null);
  const [done, setDone] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;

    setDone(false);
    const token = tokenStorage.getToken();
    const es = new EventSource(`${url}?token=${encodeURIComponent(token || "")}`);
    esRef.current = es;

    es.onmessage = (event) => {
      if (event.data.startsWith(":")) return;
      try {
        const payload: CampaignProgress = JSON.parse(event.data);
        setData(payload);
        if (payload.type === "done") {
          setDone(true);
          es.close();
        }
      } catch {
        // ignore malformed payloads
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [url]);

  return { data, done };
}
