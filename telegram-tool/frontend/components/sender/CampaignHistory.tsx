"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { senderApi } from "@/lib/api";
import type { Campaign } from "@/types";

export function CampaignHistory({ refreshKey }: { refreshKey: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    senderApi.listCampaigns().then((res) => setCampaigns(res.data));
  }, [refreshKey]);

  if (campaigns.length === 0) return null;

  return (
    <div className="glass rounded-lg p-6">
      <h2 className="font-medium text-gray-100 mb-3">Past campaigns</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400">
            <th className="p-2">Name</th>
            <th className="p-2">Total</th>
            <th className="p-2">Sent</th>
            <th className="p-2">Failed</th>
            <th className="p-2">Status</th>
            <th className="p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="p-2 text-gray-200">{c.name}</td>
              <td className="p-2 text-gray-300">{c.total}</td>
              <td className="p-2 text-gray-300">{c.sent}</td>
              <td className="p-2 text-gray-300">{c.failed}</td>
              <td className="p-2">
                <Badge status={c.status} />
              </td>
              <td className="p-2 text-gray-500">{new Date(c.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
