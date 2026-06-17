"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/connect", label: "Telegram Account" },
  { href: "/dashboard/scraper", label: "Scraper" },
  { href: "/dashboard/sender", label: "Bulk Messenger" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 bg-surface border-r border-border h-screen flex flex-col p-4">
      <div className="text-lg font-semibold text-gold mb-8 px-2">Telegram Tool</div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === item.href
                ? "bg-accent text-white"
                : "text-gray-300 hover:bg-[#1a2030]"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border pt-4 px-2">
        <div className="text-sm text-gray-400 mb-2 truncate">{user?.email}</div>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="text-sm text-gray-400 hover:text-red-400"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
