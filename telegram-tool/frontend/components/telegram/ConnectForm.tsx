"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { telegramApi } from "@/lib/api";

export function ConnectForm({ onConnected }: { onConnected: () => void }) {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await telegramApi.connect(parseInt(apiId, 10), apiHash, phone);
      setStep("otp");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await telegramApi.verifyOtp(code, needsPassword ? password : undefined);
      onConnected();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Verification failed";
      if (detail.toLowerCase().includes("two-step")) {
        setNeedsPassword(true);
      }
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  if (step === "credentials") {
    return (
      <form onSubmit={handleConnect} className="space-y-4 glass rounded-lg p-6">
        <div>
          <label className="text-sm text-gray-400 block mb-1">API ID</label>
          <Input
            value={apiId}
            onChange={(e) => setApiId(e.target.value)}
            placeholder="From my.telegram.org"
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">API Hash</label>
          <Input value={apiHash} onChange={(e) => setApiHash(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Phone number</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+15551234567"
            required
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending code..." : "Send code"}
        </Button>
        <p className="text-xs text-gray-500">
          Get your API ID and Hash from{" "}
          <a
            href="https://my.telegram.org"
            target="_blank"
            rel="noreferrer"
            className="text-accent"
          >
            my.telegram.org
          </a>
          .
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4 glass rounded-lg p-6">
      <div>
        <label className="text-sm text-gray-400 block mb-1">Verification code</label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="12345"
          required
        />
      </div>
      {needsPassword && (
        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Two-step verification password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Verifying..." : "Verify"}
      </Button>
    </form>
  );
}
