"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { tokenStorage } from "@/lib/auth";
import { scraperApi } from "@/lib/api";

export function ExportCSVButton({ jobId }: { jobId: number }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(scraperApi.exportUrl(jobId), {
        headers: { Authorization: `Bearer ${tokenStorage.getToken()}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `members_${jobId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
      {downloading ? "Downloading..." : "Export CSV"}
    </Button>
  );
}
