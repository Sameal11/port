/**
 * Admin API client — all calls go to the Express server
 * Automatically attaches the Supabase access token from the browser session
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getApiBaseUrl } from "@/lib/apiBase";


export const ADMIN_ERROR_EVENT = "admin:error";

export const ADMIN_NOTICE_EVENT = "admin:notice";

export type AdminErrorDetail = { message: string; status: number };

/** Show a short success/info toast in the admin panel. */
export function notify(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<string>(ADMIN_NOTICE_EVENT, { detail: message }));
  }
}

/** Report a failure to the admin toaster (see AdminToaster) and return an Error to throw. */
function fail(message: string, status: number): Error {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<AdminErrorDetail>(ADMIN_ERROR_EVENT, { detail: { message, status } })
    );
  }
  return new Error(message);
}

async function getToken(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw fail("Your session has expired. Please sign in again.", 401);
  return session.access_token;
}

async function send(url: string, init: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw fail("Can't reach the portfolio API. Is the server running?", 0);
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw fail(payload?.error || payload?.message || `Request failed (${res.status})`, res.status);
  }
  return payload;
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.body && !(init.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(init.headers as Record<string, string> || {}),
  };

  return send(`${getApiBaseUrl()}/admin${path}`, { ...init, headers });
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getProfile       = () => request<{ data: unknown }>("/profile");
export const saveProfile      = (body: unknown) => request<{ data: unknown }>("/profile", { method: "POST", body: JSON.stringify(body) });

// ─── Projects ────────────────────────────────────────────────────────────────
export const getProjects      = () => request<{ data: unknown[] }>("/projects");
export const createProject    = (body: unknown) => request<{ data: unknown }>("/projects", { method: "POST", body: JSON.stringify(body) });
export const updateProject    = (id: string, body: unknown) => request<{ data: unknown }>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteProject    = (id: string) => request<unknown>(`/projects/${id}`, { method: "DELETE" });
export const reorderProjects  = (orderedIds: string[]) => request<unknown>("/projects/reorder", { method: "POST", body: JSON.stringify({ orderedIds }) });

// ─── Certifications ───────────────────────────────────────────────────────────
export const getCertifications    = () => request<{ data: unknown[] }>("/certifications");
export const createCertification  = (body: unknown) => request<{ data: unknown }>("/certifications", { method: "POST", body: JSON.stringify(body) });
export const updateCertification  = (id: number, body: unknown) => request<{ data: unknown }>(`/certifications/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteCertification  = (id: number) => request<unknown>(`/certifications/${id}`, { method: "DELETE" });

// ─── Tech Stack ───────────────────────────────────────────────────────────────
export const getTechStack     = () => request<{ data: unknown[] }>("/tech-stack");
export const createTechItem   = (body: unknown) => request<{ data: unknown }>("/tech-stack", { method: "POST", body: JSON.stringify(body) });
export const updateTechItem   = (id: number, body: unknown) => request<{ data: unknown }>(`/tech-stack/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteTechItem   = (id: number) => request<unknown>(`/tech-stack/${id}`, { method: "DELETE" });
export const reorderTechStack = (orderedIds: number[]) => request<unknown>("/tech-stack/reorder", { method: "POST", body: JSON.stringify({ orderedIds }) });

// ─── Experience ───────────────────────────────────────────────────────────────
export const getExperiences    = () => request<{ data: unknown[] }>("/experience");
export const createExperience  = (body: unknown) => request<{ data: unknown }>("/experience", { method: "POST", body: JSON.stringify(body) });
export const updateExperience  = (id: number, body: unknown) => request<{ data: unknown }>(`/experience/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteExperience  = (id: number) => request<unknown>(`/experience/${id}`, { method: "DELETE" });

// ─── Education ────────────────────────────────────────────────────────────────
export const getEducations    = () => request<{ data: unknown[] }>("/education");
export const createEducation  = (body: unknown) => request<{ data: unknown }>("/education", { method: "POST", body: JSON.stringify(body) });
export const updateEducation  = (id: number, body: unknown) => request<{ data: unknown }>(`/education/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteEducation  = (id: number) => request<unknown>(`/education/${id}`, { method: "DELETE" });

// ─── Achievements ─────────────────────────────────────────────────────────────
export const getAchievements    = () => request<{ data: unknown[] }>("/achievements");
export const createAchievement  = (body: unknown) => request<{ data: unknown }>("/achievements", { method: "POST", body: JSON.stringify(body) });
export const updateAchievement  = (id: number, body: unknown) => request<{ data: unknown }>(`/achievements/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteAchievement  = (id: number) => request<unknown>(`/achievements/${id}`, { method: "DELETE" });

// ─── Social Links ─────────────────────────────────────────────────────────────
export const getSocialLinks    = () => request<{ data: unknown[] }>("/social-links");
export const saveSocialLink    = (platform: string, url: string, visible: boolean) => request<{ data: unknown }>("/social-links", { method: "POST", body: JSON.stringify({ platform, url, visible }) });
export const updateSocialLink  = (id: number, body: unknown) => request<{ data: unknown }>(`/social-links/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteSocialLink  = (id: number) => request<unknown>(`/social-links/${id}`, { method: "DELETE" });

// ─── Homepage Sections ────────────────────────────────────────────────────────
export const getHomepageSections  = () => request<{ data: unknown[] }>("/homepage-sections");
export const updateHomepageSection = (id: number, body: unknown) => request<{ data: unknown }>(`/homepage-sections/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const reorderHomepageSections = (orderedIds: number[]) => request<unknown>("/homepage-sections/reorder", { method: "POST", body: JSON.stringify({ orderedIds }) });

// ─── Theme ────────────────────────────────────────────────────────────────────
export const getTheme  = () => request<{ data: unknown }>("/theme");
export const saveTheme = (body: unknown) => request<{ data: unknown }>("/theme", { method: "PUT", body: JSON.stringify(body) });

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings = () => request<{ data: Record<string, string> }>("/settings");
export const saveSetting = (key: string, value: string) => request<{ data: unknown }>("/settings", { method: "POST", body: JSON.stringify({ key, value }) });
export const getSettingsEncryptionStatus = () => request<{ encrypted: boolean }>("/settings/encryption-status");

// ─── GitHub Sync ──────────────────────────────────────────────────────────────
export const syncGithub = (pat?: string) => request<{ data: unknown }>("/github/sync", { method: "POST", body: JSON.stringify({ pat }) });


// ─── Resume ───────────────────────────────────────────────────────────────────
export const getResume  = () => request<{ data: unknown }>("/resume");
export const saveResume = (resumeData: unknown) => request<{ data: unknown }>("/resume", { method: "POST", body: JSON.stringify({ resumeData }) });

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalytics = () => request<{ data: unknown }>("/analytics");

// ─── Media ────────────────────────────────────────────────────────────────────
export const getMedia = () => request<{ data: unknown[] }>("/media");

export async function uploadMedia(file: File, category: string): Promise<{ data: { url: string; mediaItem: unknown } }> {
  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  return send(`${getApiBaseUrl()}/admin/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export const deleteMedia = (id: number, storagePath: string, bucket: string) =>
  request<unknown>(`/media/${id}`, { method: "DELETE", body: JSON.stringify({ storagePath, bucket }) });

// ─── Token access for ImageUploader ──────────────────────────────────────────
export { getToken };
