import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, decimals?: number): string {
  if (price === undefined || price === null) return '0.00';
  const d = decimals ?? (price < 10 ? 5 : price < 1000 ? 4 : 2);
  return price.toFixed(d);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDirectionColor(direction: string): string {
  switch (direction) {
    case 'BUY': return 'text-trade-buy';
    case 'SELL': return 'text-trade-sell';
    default: return 'text-trade-neutral';
  }
}

export function getDirectionBg(direction: string): string {
  switch (direction) {
    case 'BUY': return 'bg-trade-buy/20 border-trade-buy/30 text-trade-buy';
    case 'SELL': return 'bg-trade-sell/20 border-trade-sell/30 text-trade-sell';
    default: return 'bg-trade-neutral/20 border-trade-neutral/30 text-trade-neutral';
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return '#10B981';
  if (confidence >= 65) return '#F59E0B';
  if (confidence >= 50) return '#6366F1';
  return '#EF4444';
}

export function truncateAddress(str: string, start = 6, end = 4): string {
  if (str.length <= start + end) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}
