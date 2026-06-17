"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useSSE } from "@/hooks/useSSE";
import { senderApi } from "@/lib/api";

export function CampaignProgress({ campaignId }: { campaignId: number }) {
  const { data } = useSSE(senderApi.progressUrl(campaignId));
  const [stopping, setStopping] = useState(false);

  async function handleStop() {
    setStopping(true);
    try {
      await senderApi.stopCampaign(campaignId);
    } finally {
      setStopping(false);
    }
  }

  if (!data) {
    return <p className="text-sm text-gray-400">Connecting...</p>;
  }

  const percent = data.total > 0 ? (data.sent / data.total) * 100 : 0;
  const isRunning = data.status === "running" || data.status === "paused";

  return (
    <div className="glass rounded-lg p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Badge status={data.status} />
        {isRunning && (
          <Button variant="danger" onClick={handleStop} disabled={stopping}>
            {stopping ? "Stopping..." : "Stop"}
          </Button>
        )}
      </div>
      <ProgressBar value={percent} />
      <p className="text-sm text-gray-300">
        {data.sent} sent / {data.failed} failed / {data.total} total
      </p>
      {data.current_username && (
        <p className="text-xs text-gray-500">Last sent to @{data.current_username}</p>
      )}
    </div>
  );
}
