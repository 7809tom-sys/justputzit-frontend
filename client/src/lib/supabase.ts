import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[Auth] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set; sign-in is disabled.");
}

export const supabase = createClient(
  supabaseUrl ?? "http://localhost:54321",
  supabaseKey ?? "missing-publishable-key",
);

/** Base URL of the API. Empty means same origin (local development). */
const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/+$/, "");

/** False when the build has no VITE_API_URL, so API calls would go to the website itself. */
export const isApiUrlConfigured = API_URL.length > 0;

export const apiUrl = (path: string) => `${API_URL}${path}`;

/** WebSocket URL for an API path, with the access token for the upgrade request. */
export async function apiWebSocketUrl(path: string): Promise<string> {
  const base = API_URL || window.location.origin;
  const url = new URL(path, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const token = await getAccessToken();
  if (token) url.searchParams.set("access_token", token);
  return url.toString();
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** fetch() against the API with the signed-in user's Bearer token. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(apiUrl(path), { ...init, headers });
}
