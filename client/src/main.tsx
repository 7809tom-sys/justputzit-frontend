import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { apiUrl, getAccessToken, isApiUrlConfigured } from "./lib/supabase";
import { loadAnalytics } from "./lib/analytics";
import { enablePwaUpdateRefresh } from "./lib/pwaUpdateRefresh";
import "./index.css";

const queryClient = new QueryClient();

enablePwaUpdateRefresh();
loadAnalytics();

if (import.meta.env.PROD && !isApiUrlConfigured) {
  console.error(
    "VITE_API_URL is not set for this build, so API calls go to this website instead of the API server. " +
      "Set VITE_API_URL (for example https://api.justputzit.com) in the hosting environment and redeploy.",
  );
}

// Pages where being signed out is normal: redirecting from them would just reload the same page, forever.
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (AUTH_PAGES.some(page => window.location.pathname.startsWith(page))) return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl("/api/trpc"),
      transformer: superjson,
      async headers() {
        const token = await getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      async fetch(input, init) {
        const response = await fetch(input, init);
        // A single-page-app host answers unknown paths with index.html. Seeing that here means the request
        // never reached the API; say so instead of failing later with a JSON parse error.
        if ((response.headers.get("content-type") ?? "").includes("text/html")) {
          throw new Error(
            isApiUrlConfigured
              ? "The API returned a web page instead of data. Check that VITE_API_URL points at the API server."
              : "The API address is not configured (VITE_API_URL is missing in this build).",
          );
        }
        return response;
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
