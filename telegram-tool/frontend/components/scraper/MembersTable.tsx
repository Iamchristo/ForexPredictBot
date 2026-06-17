"use client";

import type { ScrapedMember } from "@/types";

interface MembersTableProps {
  members: ScrapedMember[];
  selected: Set<number>;
  onToggle: (tgUserId: number) => void;
  onToggleAll: (checked: boolean) => void;
}

export function MembersTable({ members, selected, onToggle, onToggleAll }: MembersTableProps) {
  const allSelected = members.length > 0 && members.every((m) => selected.has(m.tg_user_id));

  return (
    <div className="overflow-auto max-h-[28rem] border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-surface sticky top-0">
          <tr className="text-left text-gray-400">
            <th className="p-2 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
            </th>
            <th className="p-2">Username</th>
            <th className="p-2">First name</th>
            <th className="p-2">Last name</th>
            <th className="p-2">Bot</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.tg_user_id} className="border-t border-border hover:bg-[#161b27]">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selected.has(m.tg_user_id)}
                  onChange={() => onToggle(m.tg_user_id)}
                />
              </td>
              <td className="p-2 text-gray-200">{m.username ? `@${m.username}` : "-"}</td>
              <td className="p-2 text-gray-300">{m.first_name || "-"}</td>
              <td className="p-2 text-gray-300">{m.last_name || "-"}</td>
              <td className="p-2 text-gray-500">{m.is_bot ? "yes" : ""}</td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No members loaded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
