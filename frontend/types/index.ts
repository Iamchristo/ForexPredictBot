export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  last_login?: string;
  avatar_url?: string;
  phone?: string;
}

export interface Subscription {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_analyses_per_day: number;
  has_ai_chat: boolean;
  has_advanced_indicators: boolean;
  is_active: boolean;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  subscription_id: number;
  status: 'active' | 'expired' | 'cancelled';
  started_at: string;
  expires_at?: string;
  billing_cycle: 'monthly' | 'yearly';
  subscription?: Subscription;
}

export interface Transaction {
  id: number;
  user_id: number;
  subscription_id?: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  payment_ref?: string;
  created_at: string;
}

export interface Signal {
  indicator: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  score: number;
  detail: string;
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Prediction {
  pair: string;
  timeframe: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  confidence_label: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  current_price: number;
  atr: number;
  rr_ratio: number;
  support: number;
  resistance: number;
  signal_counts: { buy: number; sell: number; neutral: number; total: number };
  signals: Signal[];
  chart_data: ChartCandle[];
  analysis_summary: string;
}

export interface TradeHistory {
  id: number;
  user_id: number;
  pair: string;
  market: string;
  timeframe: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  atr: number;
  signals_json?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  adminToken: string | null;
}

export interface BotMessage {
  id: string;
  type: 'bot_message' | 'user_message' | 'options' | 'typing' | 'analysis_complete' | 'analysis_start' | 'error';
  text?: string;
  avatar?: string;
  options?: { label: string; value: string; icon?: string; description?: string }[];
  data?: Prediction;
  message?: string;
}

export interface Market {
  name: string;
  icon: string;
  description: string;
  pairs: string[];
}

export interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  monthly_revenue: number;
  total_trades_today: number;
  new_users_today: number;
}
