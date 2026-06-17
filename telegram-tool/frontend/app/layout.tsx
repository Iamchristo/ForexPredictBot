import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Telegram Scraper & Bulk Messenger",
  description: "Scrape Telegram group/channel members and send bulk messages.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
