"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { scraperApi } from "@/lib/api";
import type { ScrapeJob } from "@/types";

export function ScrapeForm({ onJobDone }: { onJobDone: (job: ScrapeJob) => void }) {
  const [target, setTarget] = useState("");
  const [aggressive, setAggressive] = useState(false);
  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await scraperApi.start(target, aggressive);
      setJob({
        id: data.job_id,
        target,
        status: "pending",
        total_count: 0,
        created_at: new Date().toISOString(),
      });

      pollRef.current = setInterval(async () => {
        const res = await scraperApi.getJob(data.job_id);
        setJob(res.data);
        if (res.data.status === "done" || res.data.status === "error") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (res.data.status === "done") onJobDone(res.data);
        }
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to start scrape");
    } finally {
      setSubmitting(false);
    }
  }

  const isRunning = job && (job.status === "pending" || job.status === "running");

  return (
    <form onSubmit={handleSubmit} className="glass rounded-lg p-6 space-y-4">
      <div>
        <label className="text-sm text-gray-400 block mb-1">Group or channel</label>
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="@groupname or https://t.me/groupname"
          required
          disabled={!!isRunning}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-400">
        <input
          type="checkbox"
          checked={aggressive}
          onChange={(e) => setAggressive(e.target.checked)}
          disabled={!!isRunning}
        />
        Deep scrape (slower, for very large groups)
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={submitting || !!isRunning}>
        {isRunning ? `Scraping... (${job?.total_count ?? 0} found)` : "Scrape members"}
      </Button>
      {job?.status === "error" && (
        <p className="text-sm text-danger">{job.error_message}</p>
      )}
    </form>
  );
}
