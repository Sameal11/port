/**
 * Client-side analytics tracker
 * Fire-and-forget — never blocks the user experience
 */
export function trackEvent(
  event_type: "page_view" | "resume_download" | "project_click" | "github_click" | "contact_submit",
  event_data: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;

  // Use Next.js API route proxy (avoids CORS issues)
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type, event_data }),
  }).catch(() => { /* intentionally silent */ });
}
