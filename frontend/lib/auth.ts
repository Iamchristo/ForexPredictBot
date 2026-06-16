const TOKEN_KEY = 'fpb_token';
const ADMIN_TOKEN_KEY = 'fpb_admin_token';
const IMPERSONATING_KEY = 'fpb_impersonating';

export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
  getAdminToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  setAdminToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },
  removeAdminToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },
  setImpersonating: (val: boolean): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(IMPERSONATING_KEY, String(val));
  },
  isImpersonating: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(IMPERSONATING_KEY) === 'true';
  },
  clearImpersonation: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(IMPERSONATING_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
};
