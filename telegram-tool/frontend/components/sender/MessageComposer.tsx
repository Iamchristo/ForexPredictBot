"use client";

import { Input } from "@/components/ui/Input";

interface MessageComposerProps {
  name: string;
  onNameChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  delay: number;
  onDelayChange: (v: number) => void;
}

export function MessageComposer({
  name,
  onNameChange,
  message,
  onMessageChange,
  delay,
  onDelayChange,
}: MessageComposerProps) {
  return (
    <div className="glass rounded-lg p-6 space-y-4">
      <div>
        <label className="text-sm text-gray-400 block mb-1">Campaign name</label>
        <Input value={name} onChange={(e) => onNameChange(e.target.value)} required />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Message</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent resize-y"
          rows={5}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Write your message..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">{message.length} characters</p>
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">
          Delay between messages: {delay.toFixed(1)}s
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={delay}
          onChange={(e) => onDelayChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Fast (1s)</span>
          <span>Safe (10s)</span>
        </div>
        {delay < 3 && (
          <p className="text-xs text-yellow-400 mt-1">
            Sending too fast may trigger Telegram's flood limits.
          </p>
        )}
      </div>
    </div>
  );
}
