"use client";

import { ChangeEvent, useEffect, useState } from "react";

import { MembersTable } from "@/components/scraper/MembersTable";
import { Button } from "@/components/ui/Button";
import { scraperApi, senderApi } from "@/lib/api";
import type { ScrapedMember, ScrapeJob } from "@/types";

interface RecipientSelectorProps {
  members: ScrapedMember[];
  selected: Set<number>;
  onMembersChange: (members: ScrapedMember[]) => void;
  onSelectedChange: (selected: Set<number>) => void;
  scrapeJobId: number | null;
  onScrapeJobIdChange: (id: number | null) => void;
}

export function RecipientSelector({
  members,
  selected,
  onMembersChange,
  onSelectedChange,
  scrapeJobId,
  onScrapeJobIdChange,
}: RecipientSelectorProps) {
  const [tab, setTab] = useState<"scrape" | "csv">("scrape");
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "scrape") {
      scraperApi.listJobs().then((res) => setJobs(res.data.filter((j) => j.status === "done")));
    }
  }, [tab]);

  async function handleSelectJob(jobId: number) {
    onScrapeJobIdChange(jobId);
    setLoading(true);
    try {
      const { data } = await scraperApi.getMembers(jobId, 0, 5000);
      onMembersChange(data.members);
      onSelectedChange(new Set(data.members.map((m) => m.tg_user_id)));
    } finally {
      setLoading(false);
    }
  }

  async function handleCsvUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    onScrapeJobIdChange(null);
    try {
      const { data } = await senderApi.uploadCsv(file);
      onMembersChange(data.recipients);
      onSelectedChange(new Set(data.recipients.map((m) => m.tg_user_id)));
    } finally {
      setLoading(false);
    }
  }

  function toggle(tgUserId: number) {
    const next = new Set(selected);
    if (next.has(tgUserId)) next.delete(tgUserId);
    else next.add(tgUserId);
    onSelectedChange(next);
  }

  function toggleAll(checked: boolean) {
    const next = new Set(selected);
    members.forEach((m) => {
      if (checked) next.add(m.tg_user_id);
      else next.delete(m.tg_user_id);
    });
    onSelectedChange(next);
  }

  return (
    <div className="glass rounded-lg p-6 space-y-4">
      <div className="flex gap-2">
        <Button
          variant={tab === "scrape" ? "primary" : "secondary"}
          onClick={() => setTab("scrape")}
        >
          From scrape
        </Button>
        <Button variant={tab === "csv" ? "primary" : "secondary"} onClick={() => setTab("csv")}>
          Upload CSV
        </Button>
      </div>

      {tab === "scrape" && (
        <div>
          <label className="text-sm text-gray-400 block mb-1">Select a scrape job</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-gray-100"
            value={scrapeJobId ?? ""}
            onChange={(e) => handleSelectJob(parseInt(e.target.value, 10))}
          >
            <option value="" disabled>
              Choose a completed scrape job
            </option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.target} ({j.total_count} members)
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === "csv" && (
        <div>
          <label className="text-sm text-gray-400 block mb-1">CSV file</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="block w-full text-sm text-gray-300"
          />
        </div>
      )}

      {loading && <p className="text-sm text-gray-400">Loading members...</p>}

      <p className="text-sm text-gray-400">
        {members.length} loaded, {selected.size} selected
      </p>

      <MembersTable
        members={members}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />
    </div>
  );
}
