export interface UserInfo {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface SessionStatus {
  is_active: boolean;
  phone?: string | null;
  tg_username?: string | null;
  tg_first_name?: string | null;
}

export interface ScrapeJob {
  id: number;
  target: string;
  status: "pending" | "running" | "done" | "error";
  total_count: number;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface ScrapedMember {
  tg_user_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  is_bot: boolean;
  premium: boolean;
  access_hash?: number | null;
}

export interface Campaign {
  id: number;
  name: string;
  message_text: string;
  delay_seconds: number;
  status: "pending" | "running" | "paused" | "done" | "stopped" | "error";
  total: number;
  sent: number;
  failed: number;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface CampaignProgress {
  type?: string;
  sent: number;
  failed: number;
  total: number;
  status: string;
  current_username?: string | null;
}
