"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Project = {
  id: string;
  title: string;
  description: string;
  technologies: string[] | null;
};

type Certificate = {
  id: number;
  title: string;
  image_url: string | null;
};

type Skill = {
  id: number;
  name: string;
  logo_url: string | null;
};

type AdminPayload = {
  projects: Project[];
  certificates: Certificate[];
  skills: Skill[];
};

const emptyProjectForm = {
  title: "",
  description: "",
  live_url: "",
  github_url: "",
  image_url: "",
  technologies: "",
  key_features: "",
  image_urls: "",
};

const emptyCertificateForm = {
  title: "",
  image_url: "",
};

const emptySkillForm = {
  name: "",
  logo_url: "",
};

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error || `Request failed with status ${response.status}`
    );
  }

  return payload;
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-xs uppercase tracking-[0.28em] text-white/60">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboard({
  adminEmail,
  initialData,
}: {
  adminEmail: string;
  initialData: AdminPayload;
}) {
  const router = useRouter();
  const [data, setData] = useState<AdminPayload>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [certificateForm, setCertificateForm] = useState(
    emptyCertificateForm
  );
  const [skillForm, setSkillForm] = useState(emptySkillForm);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const payload = await fetchJson("/api/admin/portfolio", {
        cache: "no-store",
      });
      setData(payload.data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load admin data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleProjectSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSavingKey("project");
    setError("");

    try {
      await fetchJson("/api/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectForm),
      });

      setProjectForm(emptyProjectForm);
      await loadData();
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save project."
      );
    } finally {
      setSavingKey("");
    }
  }

  async function handleCertificateSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSavingKey("certificate");
    setError("");

    try {
      await fetchJson("/api/admin/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(certificateForm),
      });

      setCertificateForm(emptyCertificateForm);
      await loadData();
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save certificate."
      );
    } finally {
      setSavingKey("");
    }
  }

  async function handleSkillSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSavingKey("skill");
    setError("");

    try {
      await fetchJson("/api/admin/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(skillForm),
      });

      setSkillForm(emptySkillForm);
      await loadData();
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save skill."
      );
    } finally {
      setSavingKey("");
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050505_0%,#101010_50%,#080808_100%)] px-5 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/55">
                Admin Dashboard
              </p>
              <h1 className="text-3xl font-semibold md:text-5xl">
                Add portfolio content without touching the database.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                Signed in as {adminEmail}. New entries are saved
                directly into Supabase and will show up on the
                portfolio once the frontend refreshes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/80 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            title="Projects"
            count={data.projects.length}
          >
            <form className="grid gap-4" onSubmit={handleProjectSubmit}>
              <input
                value={projectForm.title}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                placeholder="Project title"
                required
              />
              <textarea
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-32 rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                placeholder="Project description"
                required
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={projectForm.live_url}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      live_url: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                  placeholder="Live URL"
                />
                <input
                  value={projectForm.github_url}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      github_url: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                  placeholder="GitHub URL"
                />
              </div>
              <input
                value={projectForm.image_url}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    image_url: event.target.value,
                  }))
                }
                className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                placeholder="Primary image URL"
              />
              <input
                value={projectForm.technologies}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    technologies: event.target.value,
                  }))
                }
                className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                placeholder="Technologies, comma separated"
              />
              <input
                value={projectForm.key_features}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    key_features: event.target.value,
                  }))
                }
                className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                placeholder="Key features, comma separated"
              />
              <input
                value={projectForm.image_urls}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    image_urls: event.target.value,
                  }))
                }
                className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                placeholder="Extra image URLs, comma separated"
              />
              <button
                type="submit"
                disabled={savingKey === "project"}
                className="rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingKey === "project"
                  ? "Saving project..."
                  : "Add project"}
              </button>
            </form>

            <div className="custom-scroll mt-6 max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {loading ? (
                <p className="text-sm text-white/55">Loading...</p>
              ) : data.projects.length === 0 ? (
                <p className="text-sm text-white/55">
                  No projects added yet.
                </p>
              ) : (
                data.projects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <h3 className="text-base font-medium">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      {project.description}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/42">
                      {(project.technologies || []).join(" • ")}
                    </p>
                  </article>
                ))
              )}
            </div>
          </SectionCard>

          <div className="grid gap-6">
            <SectionCard
              title="Certificates"
              count={data.certificates.length}
            >
              <form
                className="grid gap-4"
                onSubmit={handleCertificateSubmit}
              >
                <input
                  value={certificateForm.title}
                  onChange={(event) =>
                    setCertificateForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                  placeholder="Certificate title"
                  required
                />
                <input
                  value={certificateForm.image_url}
                  onChange={(event) =>
                    setCertificateForm((current) => ({
                      ...current,
                      image_url: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                  placeholder="Image URL"
                />
                <button
                  type="submit"
                  disabled={savingKey === "certificate"}
                  className="rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingKey === "certificate"
                    ? "Saving certificate..."
                    : "Add certificate"}
                </button>
              </form>

              <div className="custom-scroll mt-6 max-h-64 space-y-3 overflow-y-auto pr-2">
                {loading ? (
                  <p className="text-sm text-white/55">Loading...</p>
                ) : data.certificates.length === 0 ? (
                  <p className="text-sm text-white/55">
                    No certificates added yet.
                  </p>
                ) : (
                  data.certificates.map((certificate) => (
                    <article
                      key={certificate.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <h3 className="text-sm font-medium">
                        {certificate.title}
                      </h3>
                    </article>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Skills" count={data.skills.length}>
              <form className="grid gap-4" onSubmit={handleSkillSubmit}>
                <input
                  value={skillForm.name}
                  onChange={(event) =>
                    setSkillForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                  placeholder="Skill name"
                  required
                />
                <input
                  value={skillForm.logo_url}
                  onChange={(event) =>
                    setSkillForm((current) => ({
                      ...current,
                      logo_url: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-white/35"
                  placeholder="Logo URL"
                />
                <button
                  type="submit"
                  disabled={savingKey === "skill"}
                  className="rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingKey === "skill"
                    ? "Saving skill..."
                    : "Add skill"}
                </button>
              </form>

              <div className="custom-scroll mt-6 max-h-64 space-y-3 overflow-y-auto pr-2">
                {loading ? (
                  <p className="text-sm text-white/55">Loading...</p>
                ) : data.skills.length === 0 ? (
                  <p className="text-sm text-white/55">
                    No skills added yet.
                  </p>
                ) : (
                  data.skills.map((skill) => (
                    <article
                      key={skill.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <h3 className="text-sm font-medium">
                        {skill.name}
                      </h3>
                    </article>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}
