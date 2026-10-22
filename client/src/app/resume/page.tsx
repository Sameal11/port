import { fetchPortfolioData } from "@/lib/portfolioService";
import { Download, FileText, Briefcase, GraduationCap, Award, Trophy, Layers } from "lucide-react";

export const metadata = {
  title: "Resume — Portfolio",
  description: "View and download the professional resume.",
};

export default async function ResumePage() {
  const portfolio = await fetchPortfolioData().catch(() => null);
  const profile = portfolio?.personalInfo;
  const resumeLinks = portfolio?.resumeLinks || [];
  const experience = portfolio?.experience || [];
  const education = portfolio?.education || [];
  const skills = portfolio?.skills || [];
  const certifications = portfolio?.certifications || [];
  const achievements = portfolio?.achievements || [];

  const pdfUrl = resumeLinks[0]?.url;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050505_0%,#0d0d0d_100%)] text-white py-16">
      <div className="mx-auto max-w-4xl px-6 space-y-10">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-white/35 mb-1">Resume</p>
            <h1 className="text-4xl font-bold">{profile?.full_name || "My Resume"}</h1>
            <p className="text-white/50 mt-1">{profile?.title || ""}</p>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition"
            >
              <Download size={15} /> Download PDF
            </a>
          )}
        </div>

        {/* Experience */}
        {experience.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Briefcase size={16} className="text-violet-400" />
              <h2 className="text-lg font-semibold">Experience</h2>
            </div>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id} className="relative pl-6 border-l border-white/10">
                  <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-violet-500" />
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-white">{exp.role}</p>
                      <p className="text-sm text-white/50">{exp.company}{exp.location ? ` — ${exp.location}` : ""}</p>
                    </div>
                    <p className="text-xs text-white/35">
                      {exp.start_date} — {exp.is_current ? "Present" : (exp.end_date || "")}
                    </p>
                  </div>
                  {Array.isArray(exp.description) && exp.description.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.description.map((d, i) => (
                        <li key={i} className="text-sm text-white/55 flex gap-2">
                          <span className="text-violet-400 flex-shrink-0">•</span> {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <GraduationCap size={16} className="text-cyan-400" />
              <h2 className="text-lg font-semibold">Education</h2>
            </div>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="flex items-start justify-between flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/3 p-4">
                  <div>
                    <p className="font-semibold">{edu.degree}</p>
                    <p className="text-sm text-white/50">{edu.institution}{edu.location ? ` — ${edu.location}` : ""}{edu.gpa ? ` | GPA: ${edu.gpa}` : ""}</p>
                  </div>
                  {edu.year && <p className="text-xs text-white/35">{edu.year}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Layers size={16} className="text-emerald-400" />
              <h2 className="text-lg font-semibold">Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70">
                  {s.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Award size={16} className="text-amber-400" />
              <h2 className="text-lg font-semibold">Certifications</h2>
            </div>
            <div className="space-y-3">
              {certifications.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/3 p-4">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    {c.issuer && <p className="text-sm text-white/50">{c.issuer}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {c.issue_date && <p className="text-xs text-white/35">{c.issue_date}</p>}
                    {c.credential_url && (
                      <a href={c.credential_url} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:text-violet-300 transition">Verify ↗</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Trophy size={16} className="text-amber-400" />
              <h2 className="text-lg font-semibold">Achievements</h2>
            </div>
            <div className="space-y-3">
              {achievements.map((a) => (
                <div key={a.id} className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="flex-1">
                    <p className="font-medium">🏆 {a.title}</p>
                    {a.description && <p className="text-sm text-white/50 mt-1">{a.description}</p>}
                  </div>
                  {a.date && <p className="text-xs text-white/35 shrink-0 self-end md:self-center">{a.date}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
