"use client";

import { useState } from "react";

import { ExportCSVButton } from "@/components/scraper/ExportCSVButton";
import { MembersTable } from "@/components/scraper/MembersTable";
import { ScrapeForm } from "@/components/scraper/ScrapeForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { scraperApi } from "@/lib/api";
import type { ScrapedMember, ScrapeJob } from "@/types";

const PAGE_SIZE = 100;

export default function ScraperPage() {
  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [members, setMembers] = useState<ScrapedMember[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMembers(jobId: number, skip: number, searchTerm: string) {
    const { data } = await scraperApi.getMembers(jobId, skip, PAGE_SIZE, searchTerm || undefined);
    setTotal(data.total);
    setMembers((prev) => (skip === 0 ? data.members : [...prev, ...data.members]));
  }

  async function handleJobDone(doneJob: ScrapeJob) {
    setJob(doneJob);
    setMembers([]);
    setSelected(new Set());
    await loadMembers(doneJob.id, 0, "");
  }

  async function handleSearch() {
    if (!job) return;
    await loadMembers(job.id, 0, search);
  }

  async function handleLoadMore() {
    if (!job) return;
    setLoadingMore(true);
    try {
      await loadMembers(job.id, members.length, search);
    } finally {
      setLoadingMore(false);
    }
  }

  function toggle(tgUserId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tgUserId)) next.delete(tgUserId);
      else next.add(tgUserId);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      members.forEach((m) => {
        if (checked) next.add(m.tg_user_id);
        else next.delete(m.tg_user_id);
      });
      return next;
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-100">Scraper</h1>

      <ScrapeForm onJobDone={handleJobDone} />

      {job && job.status === "done" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {total} members found in {job.target} ({selected.size} selected)
            </p>
            <ExportCSVButton jobId={job.id} />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search by username or first name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button variant="secondary" onClick={handleSearch}>
              Search
            </Button>
          </div>

          <MembersTable
            members={members}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />

          {members.length < total && (
            <Button variant="secondary" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
