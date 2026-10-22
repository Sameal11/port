import { notFound } from "next/navigation";
import { fetchProjectById } from "@/lib/portfolioService";
import Link from "next/link";
import { ExternalLink, FolderGit2, ArrowLeft, BookOpen, Layers, Star, Eye } from "lucide-react";
import ProjectReadme from "./ProjectReadme";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await fetchProjectById(id).catch(() => null);
  return {
    title: project ? `${project.title} — Portfolio` : "Project — Portfolio",
    description: project?.description || "",
  };
}

/** Extract owner/repo from a GitHub URL */
function parseGithubRepo(url: string | null): { owner: string; repo: string } | null {
  if (!url) return null;
  try {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

/** Fetch README markdown from GitHub API */
async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Accept: "application/vnd.github.raw+json",
          "User-Agent": "Portfolio-CMS",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 3600 }, // cache for 1 hour
      }
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await fetchProjectById(id).catch(() => null);
  if (!project) notFound();

  const extraImages = Array.isArray(project.image_urls) ? project.image_urls : [];

  // Try to fetch README from GitHub
  let readmeContent: string | null = null;
  const ghRepo = parseGithubRepo(project.github_url);
  if (ghRepo) {
    readmeContent = await fetchReadme(ghRepo.owner, ghRepo.repo);
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.15),transparent)]" />

        {/* Cover image as blurred background */}
        {project.image_url && (
          <div className="absolute inset-0 opacity-10">
            <img
              src={project.image_url}
              alt=""
              className="w-full h-full object-cover blur-2xl scale-110"
            />
          </div>
        )}

        <div className="relative mx-auto max-w-5xl px-6 pt-8 pb-16">
          {/* Back link */}
          <Link
            href="/#portfolio"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-10 group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Back to Portfolio
          </Link>

          {/* Project header */}
          <div className="space-y-6">
            {/* Source badge */}
            {ghRepo && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-300">
                <FolderGit2 size={11} />
                {ghRepo.owner}/{ghRepo.repo}
              </span>
            )}

            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {project.title}
            </h1>

            <p className="text-lg text-white/60 leading-relaxed max-w-2xl">
              {project.description}
            </p>

            {/* Tech Tags */}
            {project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-300"
                  >
                    <Layers size={10} />
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* CTA Links */}
            <div className="flex flex-wrap gap-3 pt-2">
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500 transition shadow-lg shadow-violet-500/20"
                >
                  <ExternalLink size={15} />
                  Live Demo
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <FolderGit2 size={15} />
                  View Source
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-6 pb-24 space-y-12">

        {/* Cover Image */}
        {project.image_url && (
          <div className="overflow-hidden rounded-2xl border border-white/8 shadow-2xl shadow-black/50">
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Key Features */}
        {project.key_features.length > 0 && (
          <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-400" />
              <h2 className="text-base font-semibold text-white/90">Key Features</h2>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {project.key_features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 text-sm text-white/65"
                >
                  <span className="mt-0.5 text-violet-400 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* README Section */}
        {readmeContent ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-white/50" />
              <h2 className="text-base font-semibold text-white/90">README</h2>
              <span className="text-xs text-white/30 font-mono">from GitHub</span>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <ProjectReadme content={readmeContent} repoUrl={project.github_url} />
            </div>
          </section>
        ) : project.description && !project.key_features.length ? (
          // Fallback: show description as a card if no README & no features
          <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-white/50" />
              <h2 className="text-base font-semibold text-white/90">About this project</h2>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">{project.description}</p>
          </section>
        ) : null}

        {/* Screenshots */}
        {extraImages.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-white/90">Screenshots</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {extraImages.map((url, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-white/8 shadow-lg"
                >
                  <img
                    src={url}
                    alt={`${project.title} screenshot ${i + 1}`}
                    className="w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
