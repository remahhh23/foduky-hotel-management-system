const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

function getTokens() {
  try {
    const stored = localStorage.getItem("jarash_auth");
    if (!stored) return null;
    return JSON.parse(stored) as {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };
  } catch {
    return null;
  }
}

function setTokens(accessToken: string, refreshToken: string, expiresAt: string) {
  const existing = getTokens() || { user: null };
  localStorage.setItem("jarash_auth", JSON.stringify({ accessToken, refreshToken, expiresAt, ...(existing as any).user ? { user: (existing as any).user } : {} }));
}

export function clearAuth() {
  localStorage.removeItem("jarash_auth");
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken, data.expiresAt);
    return data.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const tokens = getTokens();
    if (tokens?.accessToken) {
      headers["Authorization"] = `Bearer ${tokens.accessToken}`;
    }
  }

  let res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
    } else {
      clearAuth();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function setAuthTokens(accessToken: string, refreshToken: string, expiresAt: string, user: any) {
  localStorage.setItem("jarash_auth", JSON.stringify({ accessToken, refreshToken, expiresAt, user }));
}

export function getStoredUser(): any {
  try {
    const stored = localStorage.getItem("jarash_auth");
    if (!stored) return null;
    return JSON.parse(stored).user || null;
  } catch {
    return null;
  }
}
