"use client";

import { useState } from "react";

import { CampaignHistory } from "@/components/sender/CampaignHistory";
import { CampaignProgress } from "@/components/sender/CampaignProgress";
import { MessageComposer } from "@/components/sender/MessageComposer";
import { RecipientSelector } from "@/components/sender/RecipientSelector";
import { Button } from "@/components/ui/Button";
import { senderApi } from "@/lib/api";
import type { ScrapedMember } from "@/types";

export default function SenderPage() {
  const [members, setMembers] = useState<ScrapedMember[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [scrapeJobId, setScrapeJobId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState(3);
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const memberByTgId = new Map(members.map((m) => [m.tg_user_id, m]));

  async function handleSend() {
    setError(null);
    if (selected.size === 0) {
      setError("Select at least one recipient");
      return;
    }
    if (!name || !message) {
      setError("Campaign name and message are required");
      return;
    }
    setSubmitting(true);
    try {
      const selectedIds = Array.from(selected);
      const payload = scrapeJobId
        ? {
            name,
            message_text: message,
            delay_seconds: delay,
            scrape_job_id: scrapeJobId,
            selected_tg_user_ids: selectedIds,
          }
        : {
            name,
            message_text: message,
            delay_seconds: delay,
            recipients: selectedIds
              .map((id) => memberByTgId.get(id))
              .filter((m): m is ScrapedMember => !!m),
          };

      const { data } = await senderApi.createCampaign(payload);
      await senderApi.startCampaign(data.campaign_id);
      setActiveCampaignId(data.campaign_id);
      setHistoryKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to start campaign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-100">Bulk Messenger</h1>

      <RecipientSelector
        members={members}
        selected={selected}
        onMembersChange={setMembers}
        onSelectedChange={setSelected}
        scrapeJobId={scrapeJobId}
        onScrapeJobIdChange={setScrapeJobId}
      />

      <MessageComposer
        name={name}
        onNameChange={setName}
        message={message}
        onMessageChange={setMessage}
        delay={delay}
        onDelayChange={setDelay}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button onClick={handleSend} disabled={submitting}>
        {submitting ? "Starting..." : `Send to ${selected.size} selected`}
      </Button>

      {activeCampaignId && <CampaignProgress campaignId={activeCampaignId} />}

      <CampaignHistory refreshKey={historyKey} />
    </div>
  );
}
