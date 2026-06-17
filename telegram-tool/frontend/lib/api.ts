import axios from "axios";

import { tokenStorage } from "./auth";
import type { Campaign, ScrapedMember, ScrapeJob, SessionStatus, UserInfo } from "@/types";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (email: string, name: string, password: string) =>
    api.post("/auth/register", { email, name, password }),
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  me: () => api.get<UserInfo>("/auth/me"),
};

export const telegramApi = {
  status: () => api.get<SessionStatus>("/telegram/session"),
  connect: (api_id: number, api_hash: string, phone: string) =>
    api.post("/telegram/connect", { api_id, api_hash, phone }),
  verifyOtp: (code: string, password?: string) =>
    api.post("/telegram/verify-otp", { code, password }),
  disconnect: () => api.delete("/telegram/session"),
};

export const scraperApi = {
  start: (target: string, aggressive = false) =>
    api.post<{ job_id: number }>("/scrape/start", { target, aggressive }),
  listJobs: () => api.get<ScrapeJob[]>("/scrape/jobs"),
  getJob: (jobId: number) => api.get<ScrapeJob>(`/scrape/jobs/${jobId}`),
  getMembers: (jobId: number, skip = 0, limit = 100, search?: string) =>
    api.get<{ total: number; members: ScrapedMember[] }>(`/scrape/jobs/${jobId}/members`, {
      params: { skip, limit, search },
    }),
  exportUrl: (jobId: number) => `/api/scrape/jobs/${jobId}/export`,
  deleteJob: (jobId: number) => api.delete(`/scrape/jobs/${jobId}`),
};

export const senderApi = {
  uploadCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ recipients: ScrapedMember[] }>("/send/campaigns/upload-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  createCampaign: (payload: {
    name: string;
    message_text: string;
    delay_seconds: number;
    recipients?: ScrapedMember[];
    scrape_job_id?: number;
    selected_tg_user_ids?: number[];
  }) => api.post<{ campaign_id: number }>("/send/campaigns", payload),
  startCampaign: (campaignId: number) => api.post(`/send/campaigns/${campaignId}/start`),
  stopCampaign: (campaignId: number) => api.post(`/send/campaigns/${campaignId}/stop`),
  listCampaigns: () => api.get<Campaign[]>("/send/campaigns"),
  getCampaign: (campaignId: number) => api.get<Campaign>(`/send/campaigns/${campaignId}`),
  progressUrl: (campaignId: number) => `/api/send/campaigns/${campaignId}/progress`,
};

export default api;
