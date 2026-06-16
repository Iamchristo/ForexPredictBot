'use client';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { BotChat } from '@/components/bot/BotChat';

export default function TradePage() {
  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader title="AI Trading Bot" />
      <div className="flex-1 overflow-hidden">
        <BotChat />
      </div>
    </div>
  );
}
