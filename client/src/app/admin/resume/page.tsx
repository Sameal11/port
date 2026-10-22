"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  getResume,
  saveResume,
  getProfile,
  getProjects,
  getCertifications,
  getTechStack,
  getExperiences,
  getEducations,
  getAchievements,
  getSocialLinks,
  getToken,
  updateProject as updateCmsProject,
} from "@/lib/adminApi";
import { Sparkles, Database, Save, RefreshCw } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";

const empty = (v: any) => !v || !String(v).trim();

// Ensure URL has https:// prefix
const toUrl = (val: string) => {
  if (!val || !val.trim()) return "";
  const v = val.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return "https://" + v;
};

// Display label for a URL (strip protocol)
const toLabel = (val: string) => {
  if (!val) return "";
  return val.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
};

const educationScoreLabel = (gpa: string, percentage: string) => {
  const scores = [];
  if (gpa.trim()) scores.push(`CGPA: ${gpa.trim()}`);
  if (percentage.trim()) scores.push(`Percentage: ${percentage.trim().replace(/%$/, "")}%`);
  return scores.join(" | ");
};

export default function ResumePage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    linkedin: "",
    github: "",
    objective: "",
    eduDegree: "",
    eduCollege: "",
    eduYear: "",
    eduLocation: "",
    eduGpa: "",
    eduPercentage: "",
    edu2Degree: "",
    edu2College: "",
    edu2Year: "",
    edu2Gpa: "",
    edu2Percentage: "",
    edu3Degree: "",
    edu3College: "",
    edu3Year: "",
    edu3Gpa: "",
    edu3Percentage: "",
    skillLang: "",
    skillWeb: "",
    skillAI: "",
    skillTools: "",
    experience: "",
  });

  const [projects, setProjects] = useState<Array<{
    title: string;
    tech: string;
    date: string;
    bullets: string;
    liveUrl: string;
    repoUrl: string;
  }>>([
    { title: "", tech: "", date: "", bullets: "", liveUrl: "", repoUrl: "" },
  ]);

  const [certifications, setCertifications] = useState<Array<{
    title: string;
    issuer: string;
    date: string;
    credentialId: string;
    credentialUrl: string;
  }>>([
    { title: "", issuer: "", date: "", credentialId: "", credentialUrl: "" },
  ]);

  const [achievements, setAchievements] = useState<Array<{
    title: string;
    description: string;
    date: string;
  }>>([
    { title: "", description: "", date: "" },
  ]);

  // Loading, saving, message state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Database drawer / popover visibility
  const [activeImportPanel, setActiveImportPanel] = useState<string | null>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [dbEducation, setDbEducation] = useState<any[]>([]);
  const [dbExperience, setDbExperience] = useState<any[]>([]);
  const [dbSkills, setDbSkills] = useState<any[]>([]);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [dbCertifications, setDbCertifications] = useState<any[]>([]);
  const [dbAchievements, setDbAchievements] = useState<any[]>([]);
  const [dbSocialLinks, setDbSocialLinks] = useState<any[]>([]);

  const previewRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addProject = () =>
    setProjects((p) => [
      ...p,
      { title: "", tech: "", date: "", bullets: "", liveUrl: "", repoUrl: "" },
    ]);
  const removeProject = (i: number) =>
    setProjects((p) => p.filter((_, idx) => idx !== i));
  const updateProject = (i: number, key: string, value: string) =>
    setProjects((p) =>
      p.map((proj, idx) => (idx === i ? { ...proj, [key]: value } : proj))
    );

  // Appends a new empty bullet line to a project's bullets field
  const addProjectBullet = (i: number) =>
    setProjects((p) =>
      p.map((proj, idx) =>
        idx === i
          ? { ...proj, bullets: proj.bullets ? `${proj.bullets}\n• ` : "• " }
          : proj
      )
    );

  const addCertification = () =>
    setCertifications((c) => [
      ...c,
      { title: "", issuer: "", date: "", credentialId: "", credentialUrl: "" },
    ]);
  const removeCertification = (i: number) =>
    setCertifications((c) => c.filter((_, idx) => idx !== i));
  const updateCertificationState = (i: number, key: string, value: string) =>
    setCertifications((c) =>
      c.map((item, idx) => (idx === i ? { ...item, [key]: value } : item))
    );

  const addAchievement = () =>
    setAchievements((a) => [
      ...a,
      { title: "", description: "", date: "" },
    ]);
  const removeAchievement = (i: number) =>
    setAchievements((a) => a.filter((_, idx) => idx !== i));
  const updateAchievementState = (i: number, key: string, value: string) =>
    setAchievements((a) =>
      a.map((item, idx) => (idx === i ? { ...item, [key]: value } : item))
    );

  const hasContent = !empty(form.name) || !empty(form.email);

  // Date parsing utility
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatDateRange = (exp: any) => {
    const start = formatDate(exp.start_date);
    const end = exp.is_current ? "Present" : formatDate(exp.end_date);
    if (!start && !end) return "";
    return `${start} – ${end}`;
  };

  // Load saved resume data and Supabase database details
  const loadResumeData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getResume();
      const d = r.data as { resume_data?: { form: typeof form; projects: typeof projects; certifications?: typeof certifications; achievements?: typeof achievements } } | null;
      if (d?.resume_data) {
        if (d.resume_data.form) setForm((prev) => ({ ...prev, ...d.resume_data?.form }));
        if (d.resume_data.projects) setProjects(d.resume_data.projects);
        if (d.resume_data.certifications) setCertifications(d.resume_data.certifications);
        if (d.resume_data.achievements) setAchievements(d.resume_data.achievements);
      }
    } catch {
      /* silent fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDbData = useCallback(async () => {
    try {
      const [profileRes, eduRes, expRes, skillsRes, projRes, certsRes, achsRes, socialRes] =
        await Promise.all([
          getProfile().catch(() => ({ data: null })),
          getEducations().catch(() => ({ data: [] })),
          getExperiences().catch(() => ({ data: [] })),
          getTechStack().catch(() => ({ data: [] })),
          getProjects().catch(() => ({ data: [] })),
          getCertifications().catch(() => ({ data: [] })),
          getAchievements().catch(() => ({ data: [] })),
          getSocialLinks().catch(() => ({ data: [] })),
        ]);

      setDbProfile(profileRes.data);
      setDbEducation(eduRes.data || []);
      setDbExperience(expRes.data || []);
      setDbSkills(skillsRes.data || []);
      setDbProjects(projRes.data || []);
      setDbCertifications(certsRes.data || []);
      setDbAchievements(achsRes.data || []);
      setDbSocialLinks(socialRes.data || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadResumeData();
    loadDbData();
  }, [loadResumeData, loadDbData]);

  // Save the full resume JSON
  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await saveResume({ form, projects, certifications, achievements });

      // Automatically generate and save the PDF on the backend
      try {
        const token = await getToken();
        const res = await fetch(`${getApiBaseUrl()}/admin/resume/pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            resumeData: {
              personal: {
                full_name: form.name,
                email: form.email,
                phone: form.phone,
                location: form.location,
                linkedin: form.linkedin,
                github: form.github,
              },
              education: [
                ...(form.eduDegree ? [{ degree: form.eduDegree, institution: form.eduCollege, year: form.eduYear, location: form.eduLocation, gpa: form.eduGpa, percentage: form.eduPercentage }] : []),
                ...(form.edu2Degree ? [{ degree: form.edu2Degree, institution: form.edu2College, year: form.edu2Year, gpa: form.edu2Gpa, percentage: form.edu2Percentage }] : []),
                ...(form.edu3Degree ? [{ degree: form.edu3Degree, institution: form.edu3College, year: form.edu3Year, gpa: form.edu3Gpa, percentage: form.edu3Percentage }] : [])
              ],
              experience: form.experience ? form.experience.split("\n\n").map(block => {
                const lines = block.split("\n").filter(Boolean);
                if (!lines.length) return null;
                const parts = lines[0].split("|").map(s => s.trim());
                return {
                  role: parts[0] || "",
                  company: parts[1] || "",
                  location: parts[2] || "",
                  dateRange: parts[3] || "",
                  description: lines.slice(1).map(l => l.replace(/^[-•*]\s*/, ""))
                };
              }).filter(Boolean) : [],
              skills: [
                ...(form.skillLang ? form.skillLang.split(",").map(s => s.trim()).map(s => ({ name: s, category: 'Languages' })) : []),
                ...(form.skillWeb ? form.skillWeb.split(",").map(s => s.trim()).map(s => ({ name: s, category: 'Web & Frameworks' })) : []),
                ...(form.skillAI ? form.skillAI.split(",").map(s => s.trim()).map(s => ({ name: s, category: 'Cybersecurity' })) : []),
                ...(form.skillTools ? form.skillTools.split(",").map(s => s.trim()).map(s => ({ name: s, category: 'Tools & Platforms' })) : [])
              ],
              projects: projects.map(p => ({
                title: p.title,
                technologies: p.tech,
                description: p.bullets,
                github_url: p.repoUrl,
                live_url: p.liveUrl,
                date: p.date
              })),
              certifications: certifications.map(c => ({
                title: c.title,
                issuer: c.issuer,
                issue_date: c.date,
                credential_url: c.credentialUrl,
                credential_id: c.credentialId
              })),
              achievements: achievements.map(a => ({
                title: a.title,
                description: a.description,
                achievement_date: a.date
              }))
            },
            save: true
          })
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server returned ${res.status}: ${errText}`);
        }
      } catch (err) {
        console.error("Failed to generate PDF resume:", err);
      }

      setMsg({ type: "success", text: "Resume saved successfully!" });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  // Client side PDF generation using html2pdf.js
  const downloadPDF = async () => {
    if (!hasContent) {
      alert("Fill in your details first.");
      return;
    }
    const html2pdf = (await import("html2pdf.js")).default;
    const el = previewRef.current;
    if (!el) return;
    const origStyle = el.getAttribute("style") || "";
    el.style.boxShadow = "none";
    el.style.border = "none";
    el.style.borderRadius = "0";

    html2pdf()
      .set({
        margin: [8, 12, 8, 12],
        filename: `${form.name || "resume"}.pdf`,
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all"] },
      } as any)
      .from(el)
      .save()
      .then(() => {
        el.setAttribute("style", origStyle);
      });
  };

  // Database importers mapping logic
  const syncFromProfile = () => {
    if (!dbProfile) return;
    const ghLink = dbSocialLinks.find(s => s.platform.toLowerCase() === "github")?.url || "";
    const liLink = dbSocialLinks.find(s => s.platform.toLowerCase() === "linkedin")?.url || "";
    setForm((f) => ({
      ...f,
      name: dbProfile.full_name || f.name,
      phone: dbProfile.phone || f.phone,
      email: dbProfile.email || f.email,
      location: dbProfile.location || f.location,
      github: ghLink || f.github,
      linkedin: liLink || f.linkedin,
    }));
  };

  const educationScore = (item: any) => {
    const storedScore = String(item.percentage || item.gpa || "").trim();
    return {
      gpa: item.percentage ? "" : (storedScore.includes("%") ? "" : storedScore),
      percentage: item.percentage || (storedScore.includes("%") ? storedScore.replace("%", "").trim() : ""),
    };
  };

  const importEducation = (item: any, slot: 1 | 2 | 3) => {
    const slotSuffix = slot === 1 ? "" : String(slot);
    const score = educationScore(item);
    setForm((f) => ({
      ...f,
      [`edu${slotSuffix}Degree`]: item.degree || "",
      [`edu${slotSuffix}College`]: item.institution || "",
      [`edu${slotSuffix}Year`]: item.year || "",
      [`edu${slotSuffix}Gpa`]: score.gpa,
      [`edu${slotSuffix}Percentage`]: score.percentage,
      eduLocation: slot === 1 ? (item.location || "") : f.eduLocation,
    }));
  };

  const toExperienceBlock = (item: any) => {
    const bullets = Array.isArray(item.description)
      ? item.description.map((line: string) => `• ${line}`).join("\n")
      : typeof item.description === "string"
        ? item.description.split("\n").map((line: string) => `• ${line.trim().replace(/^[-•*]\s*/, "")}`).join("\n")
        : "";
    return `${item.role || ""} | ${item.company || ""} | ${item.location || ""} | ${formatDateRange(item)}\n${bullets}`.trim();
  };

  // Replaces resume-builder sections with the content already managed in the CMS.
  // Saved resume-specific text (for example a manually written summary) is kept
  // whenever the profile does not supply an equivalent value.
  //
  // NOTE: category mapping below is kept in sync with importSkills() further down.
  // "AI/ML" and "Cybersecurity" content both live in skillAI (the visible
  // "Cybersecurity" field); "Cloud"/"DevOps"/"Tools & Platforms" live in skillTools.
  const syncAllFromDatabase = () => {
    const ghLink = dbSocialLinks.find((s) => s.platform?.toLowerCase() === "github")?.url || "";
    const liLink = dbSocialLinks.find((s) => s.platform?.toLowerCase() === "linkedin")?.url || "";
    const education = dbEducation.slice(0, 3);
    const educationForm = education.reduce((values, item, index) => {
      const suffix = index === 0 ? "" : String(index + 1);
      const score = educationScore(item);
      return {
        ...values,
        [`edu${suffix}Degree`]: item.degree || "",
        [`edu${suffix}College`]: item.institution || "",
        [`edu${suffix}Year`]: item.year || "",
        [`edu${suffix}Gpa`]: score.gpa,
        [`edu${suffix}Percentage`]: score.percentage,
        ...(index === 0 ? { eduLocation: item.location || "" } : {}),
      };
    }, {} as Record<string, string>);

    const skillsByCategory = (categories: string[]) => dbSkills
      .filter((skill) => categories.includes(skill.category?.toLowerCase()))
      .map((skill) => skill.name)
      .filter(Boolean)
      .join(", ");

    setForm((current) => ({
      ...current,
      eduDegree: "",
      eduCollege: "",
      eduYear: "",
      eduLocation: "",
      eduGpa: "",
      eduPercentage: "",
      edu2Degree: "",
      edu2College: "",
      edu2Year: "",
      edu2Gpa: "",
      edu2Percentage: "",
      edu3Degree: "",
      edu3College: "",
      edu3Year: "",
      edu3Gpa: "",
      edu3Percentage: "",
      ...educationForm,
      name: dbProfile?.full_name || current.name,
      phone: dbProfile?.phone || current.phone,
      email: dbProfile?.email || current.email,
      location: dbProfile?.location || current.location,
      objective: dbProfile?.bio || current.objective,
      github: ghLink || current.github,
      linkedin: liLink || current.linkedin,
      skillLang: skillsByCategory(["languages", "language"]) || current.skillLang,
      skillWeb: skillsByCategory(["web & frameworks", "web", "frameworks"]) || current.skillWeb,
      // Fixed: AI/ML + Cybersecurity both belong to the visible "Cybersecurity" field (skillAI)
      skillAI: skillsByCategory(["ai/ml", "ai", "machine learning", "cybersecurity", "cyber security", "security"]) || current.skillAI,
      // Fixed: Tools & Platforms now only pulls cloud/devops/tools — no longer swallows cybersecurity
      skillTools: skillsByCategory(["cloud", "devops", "tools & platforms", "tools", "platforms"]) || current.skillTools,
      experience: dbExperience.map(toExperienceBlock).filter(Boolean).join("\n\n") || current.experience,
    }));
    setProjects(dbProjects.length ? dbProjects.map((item) => ({
      title: item.title || "",
      tech: Array.isArray(item.technologies) ? item.technologies.join(", ") : item.technologies || "",
      date: "",
      bullets: Array.isArray(item.key_features) ? item.key_features.join("\n") : item.description || "",
      liveUrl: item.live_url || "",
      repoUrl: item.github_url || "",
    })) : projects);
    setCertifications(dbCertifications.length ? dbCertifications.map((item) => ({
      title: item.title || "",
      issuer: item.issuer || "",
      date: formatDate(item.issue_date),
      credentialId: item.credential_id || "",
      credentialUrl: item.credential_url || "",
    })) : certifications);
    setAchievements(dbAchievements.length ? dbAchievements.map((item) => ({
      title: item.title || "",
      description: item.description || "",
      date: formatDate(item.achievement_date),
    })) : achievements);
    setMsg({ type: "success", text: "Resume builder synced from the database." });
  };

  const importExperience = (item: any) => {
    const block = toExperienceBlock(item);
    setForm((f) => ({
      ...f,
      experience: f.experience ? `${f.experience}\n\n${block}` : block,
    }));
  };

  const importProject = async (item: any) => {
    const project = item;
    const bullets = Array.isArray(project.key_features)
      ? project.key_features.join("\n")
      : Array.isArray(project.description)
        ? project.description.join("\n")
        : project.description || "";
    const newProj = {
      title: project.title || "",
      tech: Array.isArray(project.technologies)
        ? project.technologies.join(", ")
        : project.technologies || "",
      date: "",
      bullets: bullets,
      liveUrl: project.live_url || "",
      repoUrl: project.github_url || "",
    };
    setProjects((prev) => {
      const isEmpty = prev.length === 1 && !prev[0].title && !prev[0].bullets;
      return isEmpty ? [newProj] : [...prev, newProj];
    });
  };

  // Normalize skill categories so imports work even when the DB
  // contains different casing or extra spaces.
  const normalizeSkillCategory = (value: any) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " "); // fixed: was an escaped literal "\\s+", which never matched real whitespace

  const importSkills = (
    categories: string[],
    targetKey: keyof typeof form
  ) => {
    const normalizedCategories = categories.map(normalizeSkillCategory);

    const skillsInCat = dbSkills
      .filter((skill) =>
        normalizedCategories.includes(normalizeSkillCategory(skill.category))
      )
      .map((skill) => String(skill.name || "").trim())
      .filter(Boolean);

    if (skillsInCat.length === 0) return;

    setForm((current) => {
      const existing = String(current[targetKey] || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      // Merge imported skills without creating duplicates.
      const merged = [...existing, ...skillsInCat].filter(
        (skill, index, array) =>
          array.findIndex(
            (item) => item.toLowerCase() === skill.toLowerCase()
          ) === index
      );

      return {
        ...current,
        [targetKey]: merged.join(", "),
      };
    });
  };

  const importCertification = (item: any) => {
    const formattedDate = formatDate(item.issue_date);
    const newCert = {
      title: item.title || "",
      issuer: item.issuer || "",
      date: formattedDate || "",
      credentialId: item.credential_id || "",
      credentialUrl: item.credential_url || "",
    };
    setCertifications((prev) => {
      const isEmpty = prev.length === 1 && !prev[0].title && !prev[0].issuer;
      return isEmpty ? [newCert] : [...prev, newCert];
    });
  };

  const importAchievement = (item: any) => {
    const formattedDate = formatDate(item.achievement_date);
    const newAch = {
      title: item.title || "",
      description: item.description || "",
      date: formattedDate || "",
    };
    setAchievements((prev) => {
      const isEmpty = prev.length === 1 && !prev[0].title && !prev[0].description;
      return isEmpty ? [newAch] : [...prev, newAch];
    });
  };

  // Helper toggle drawer
  const toggleImport = (panelName: string) => {
    setActiveImportPanel((p) => (p === panelName ? null : panelName));
  };

  const skillLines = ([
    form.skillLang ? { label: "Languages", val: form.skillLang } : null,
    form.skillWeb ? { label: "Web & Frameworks", val: form.skillWeb } : null,
    form.skillAI ? { label: "Cybersecurity", val: form.skillAI } : null,
    form.skillTools ? { label: "Tools & Platforms", val: form.skillTools } : null,
  ].filter(Boolean) as Array<{ label: string; val: string }>);

  const filledProjects = projects.filter((p) => p.title || p.bullets);

  const contactItems = ([
    form.phone ? { text: form.phone, url: null } : null,
    form.email ? { text: form.email, url: `mailto:${form.email}` } : null,
    form.location ? { text: form.location, url: null } : null,
    form.linkedin
      ? { text: toLabel(form.linkedin), url: toUrl(form.linkedin) }
      : null,
    form.github
      ? { text: toLabel(form.github), url: toUrl(form.github) }
      : null,
  ].filter(Boolean) as Array<{ text: string; url: string | null }>);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-white/30 text-sm animate-pulse">
        Loading resume data…
      </div>
    );

  return (
    <div style={S.root} className="resume-root">
      {/* ════════════════ LEFT: FORM ════════════════ */}
      <div style={S.formPanel}>
        <div className="flex justify-between items-center mb-4">
          <div style={S.panelTitle}>Resume Builder</div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncAllFromDatabase}
              style={S.syncBtn}
              title="Replace populated resume sections with content from the CMS"
              aria-label="Sync entire resume from database"
            >
              <RefreshCw size={12} /> Sync from DB
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label="Save resume data"
              style={{
                background: "rgba(124, 58, 237, 0.15)",
                color: "#c084fc",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontWeight: 600,
              }}
            >
              <Save size={12} />
              {saving ? "Saving…" : "Save Data"}
            </button>
          </div>
        </div>

        {msg.text && (
          <div
            role="status"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 12,
              background: msg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: msg.type === "success" ? "#34d399" : "#f87171",
              border: msg.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            {msg.text}
          </div>
        )}

        {/* Personal */}
        <Grp label="Personal Details">
          {dbProfile && (
            <button
              onClick={syncFromProfile}
              style={S.dbMiniBtn}
              title="Sync contact info from database profile"
            >
              <Sparkles size={11} /> Sync from DB Profile
            </button>
          )}
          <F label="Full Name">
            <input style={S.inp} placeholder="Your Full Name" value={form.name} onChange={set("name")} />
          </F>
          <Row>
            <F label="Phone">
              <input style={S.inp} placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
            </F>
            <F label="Email">
              <input style={S.inp} placeholder="you@email.com" value={form.email} onChange={set("email")} />
            </F>
          </Row>
          <F label="Location">
            <input style={S.inp} placeholder="Jaipur, Rajasthan, India" value={form.location} onChange={set("location")} />
          </F>
          <Row>
            <F label="LinkedIn URL">
              <input
                style={S.inp}
                placeholder="linkedin.com/in/username"
                value={toLabel(form.linkedin)}
                onChange={(e) => setForm((f) => ({ ...f, linkedin: toUrl(e.target.value) }))}
              />
            </F>
            <F label="GitHub URL">
              <input
                style={S.inp}
                placeholder="github.com/username"
                value={toLabel(form.github)}
                onChange={(e) => setForm((f) => ({ ...f, github: toUrl(e.target.value) }))}
              />
            </F>
          </Row>
        </Grp>

        {/* Summary */}
        <Grp label="Professional Summary">
          <F label="2–3 sentences about your background and goals">
            <textarea
              style={{ ...S.inp, minHeight: 75, resize: "vertical" }}
              placeholder="Final-year B.Tech student in AI & ML with hands-on experience..."
              value={form.objective}
              onChange={set("objective")}
            />
          </F>
        </Grp>

        {/* Education */}
        <Grp label="Education">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => toggleImport("education")} style={S.dbMiniBtn}>
              <Database size={10} /> {activeImportPanel === "education" ? "Close Import Panel" : "Import from DB"}
            </button>
          </div>
          {activeImportPanel === "education" && (
            <div style={S.dbDrawer}>
              {dbEducation.map((edu) => (
                <div key={edu.id} style={S.dbRowItem}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#fff" }}>{edu.degree}</p>
                    <p style={{ color: "#aaa" }}>{edu.institution}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => importEducation(edu, 1)} style={S.dbActionBtn}>Import to Degree 1</button>
                    <button onClick={() => importEducation(edu, 2)} style={S.dbActionBtn}>Import to Degree 2</button>
                    <button onClick={() => importEducation(edu, 3)} style={S.dbActionBtn}>Import to Class 10</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={S.subGrp}>
            <div style={S.subLabel}>Degree 1</div>
            <Row>
              <F label="Degree / Programme">
                <input style={S.inp} placeholder="B.Tech in AI & Machine Learning" value={form.eduDegree} onChange={set("eduDegree")} />
              </F>
              <F label="Year">
                <input style={S.inp} placeholder="Ongoing" value={form.eduYear} onChange={set("eduYear")} />
              </F>
            </Row>
            <Row>
              <F label="College / University">
                <input style={S.inp} placeholder="University Name" value={form.eduCollege} onChange={set("eduCollege")} />
              </F>
              <F label="Location">
                <input style={S.inp} placeholder="Rajasthan" value={form.eduLocation} onChange={set("eduLocation")} />
              </F>
            </Row>
            <Row>
              <F label="CGPA (optional)">
                <input style={S.inp} placeholder="8.5 / 10" value={form.eduGpa} onChange={set("eduGpa")} />
              </F>
              <F label="Percentage (optional)">
                <input style={S.inp} placeholder="85" value={form.eduPercentage} onChange={set("eduPercentage")} />
              </F>
            </Row>
          </div>
          <div style={S.subGrp}>
            <div style={S.subLabel}>Class 12 / Higher Secondary (optional)</div>
            <Row>
              <F label="Degree">
                <input style={S.inp} placeholder="Higher Secondary Certificate (12th)" value={form.edu2Degree} onChange={set("edu2Degree")} />
              </F>
              <F label="Year">
                <input style={S.inp} placeholder="2022" value={form.edu2Year} onChange={set("edu2Year")} />
              </F>
            </Row>
            <F label="College / School">
              <input style={S.inp} placeholder="School Name, City" value={form.edu2College} onChange={set("edu2College")} />
            </F>
            <Row>
              <F label="CGPA (optional)">
                <input style={S.inp} placeholder="9.1 / 10" value={form.edu2Gpa} onChange={set("edu2Gpa")} />
              </F>
              <F label="Percentage (optional)">
                <input style={S.inp} placeholder="91" value={form.edu2Percentage} onChange={set("edu2Percentage")} />
              </F>
            </Row>
          </div>
          <div style={S.subGrp}>
            <div style={S.subLabel}>Class 10 / Secondary (optional)</div>
            <Row>
              <F label="Board / Qualification">
                <input style={S.inp} placeholder="Secondary School Certificate (10th)" value={form.edu3Degree} onChange={set("edu3Degree")} />
              </F>
              <F label="Year">
                <input style={S.inp} placeholder="2020" value={form.edu3Year} onChange={set("edu3Year")} />
              </F>
            </Row>
            <F label="School">
              <input style={S.inp} placeholder="School Name, City" value={form.edu3College} onChange={set("edu3College")} />
            </F>
            <Row>
              <F label="CGPA (optional)">
                <input style={S.inp} placeholder="9.4 / 10" value={form.edu3Gpa} onChange={set("edu3Gpa")} />
              </F>
              <F label="Percentage (optional)">
                <input style={S.inp} placeholder="94" value={form.edu3Percentage} onChange={set("edu3Percentage")} />
              </F>
            </Row>
          </div>
        </Grp>

        {/* Experience */}
        <Grp label="Experience">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => toggleImport("experience")} style={S.dbMiniBtn}>
              <Database size={10} /> {activeImportPanel === "experience" ? "Close Import Panel" : "Import from DB"}
            </button>
          </div>
          {activeImportPanel === "experience" && (
            <div style={S.dbDrawer}>
              {dbExperience.map((exp) => (
                <div key={exp.id} style={S.dbRowItem}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#fff" }}>{exp.role}</p>
                    <p style={{ color: "#aaa" }}>{exp.company}</p>
                  </div>
                  <button onClick={() => importExperience(exp)} style={S.dbActionBtn}>+ Add to Form</button>
                </div>
              ))}
            </div>
          )}

          <F label="Format: Role | Company | Location | Date — then bullet points. Separate roles with a blank line.">
            <textarea
              style={{ ...S.inp, minHeight: 110, resize: "vertical" }}
              placeholder={
                "Data Science Intern | ONGC | Dehradun, India | Jul 2025 – Aug 2025\n• Built an ML web app to predict heart disease risk\n• Engineered end-to-end ML pipeline\n\nSoftware Intern | ABC Ltd | Remote | Jan 2025 – Mar 2025\n• Developed REST APIs with Node.js"
              }
              value={form.experience}
              onChange={set("experience")}
            />
          </F>
        </Grp>

        {/* Projects */}
        <Grp label="Projects">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => toggleImport("projects")} style={S.dbMiniBtn}>
              <Database size={10} /> {activeImportPanel === "projects" ? "Close Import Panel" : "Import from DB"}
            </button>
          </div>
          {activeImportPanel === "projects" && (
            <div style={S.dbDrawer}>
              {dbProjects.map((p) => (
                <div key={p.id} style={S.dbRowItem}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#fff" }}>{p.title}</p>
                    <p style={{ color: "#aaa" }}>{p.github_url || "No link"}</p>
                  </div>
                  <button
                    onClick={() => void importProject(p)}
                    style={S.dbActionBtn}
                  >
                    + Add to Form
                  </button>
                </div>
              ))}
            </div>
          )}

          {projects.map((proj, i) => (
            <div key={i} style={S.projBlock}>
              <div style={S.projHead}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>Project {i + 1}</span>
                {projects.length > 1 && (
                  <button style={S.removeBtn} onClick={() => removeProject(i)} aria-label={`Remove project ${i + 1}`}>✕</button>
                )}
              </div>
              <Row>
                <F label="Title">
                  <input style={S.inp} placeholder="Plant Disease Detection using CNN" value={proj.title} onChange={(e) => updateProject(i, "title", e.target.value)} />
                </F>
                <F label="Date">
                  <input style={S.inp} placeholder="Jan 2026" value={proj.date} onChange={(e) => updateProject(i, "date", e.target.value)} />
                </F>
              </Row>
              <F label="Tech Stack">
                <input style={S.inp} placeholder="Python, FastAPI, Docker, AWS" value={proj.tech} onChange={(e) => updateProject(i, "tech", e.target.value)} />
              </F>
              {/* hyperlink fields */}
              <Row>
                <F label="Live Demo URL (optional)">
                  <input style={S.inp} placeholder="https://myproject.vercel.app" value={proj.liveUrl} onChange={(e) => updateProject(i, "liveUrl", e.target.value)} />
                </F>
                <F label="GitHub Repo URL (optional)">
                  <input style={S.inp} placeholder="github.com/user/repo" value={proj.repoUrl} onChange={(e) => updateProject(i, "repoUrl", e.target.value)} />
                </F>
              </Row>
              <F label="Bullet points (one per line)">
                <textarea
                  style={{ ...S.inp, minHeight: 60, resize: "vertical" }}
                  placeholder={"Trained a CNN model on 70,000+ images achieving 93% accuracy\nDeployed scalable REST API backend on AWS EC2"}
                  value={proj.bullets}
                  onChange={(e) => updateProject(i, "bullets", e.target.value)}
                  onKeyDown={(e) => {
                    // Auto-continue bullet prefix on Enter for faster typing
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const target = e.target as HTMLTextAreaElement;
                      const { selectionStart, value } = target;
                      const newValue =
                        value.slice(0, selectionStart) + "\n• " + value.slice(selectionStart);
                      updateProject(i, "bullets", newValue);
                      requestAnimationFrame(() => {
                        target.selectionStart = target.selectionEnd = selectionStart + 3;
                      });
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addProjectBullet(i)}
                  style={{
                    ...S.dbSmallActionBtn,
                    marginTop: 6,
                    color: "#7c3aed",
                    background: "rgba(124,58,237,0.06)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    fontWeight: 600,
                  }}
                >
                  + Add Bullet
                </button>
              </F>
            </div>
          ))}
          <button style={S.addBtn} onClick={addProject}>+ Add Project</button>
        </Grp>

        {/* Skills */}
        <Grp label="Skills">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <span style={{ fontSize: 9, color: "rgb(5, 5, 5)", fontWeight: 600 }}>Quick import categorized tech skills:</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() =>
                  importSkills(["languages", "language"], "skillLang")
                }
                style={S.dbSmallActionBtn}
              >
                Languages
              </button>

              <button
                onClick={() =>
                  importSkills(
                    ["web & frameworks", "web", "frameworks", "web frameworks"],
                    "skillWeb"
                  )
                }
                style={S.dbSmallActionBtn}
              >
                Web & Frameworks
              </button>

              <button
                onClick={() =>
                  importSkills(
                    ["cloud", "cloud platforms", "aws", "cloud & platforms"],
                    "skillTools"
                  )
                }
                style={S.dbSmallActionBtn}
              >
                Cloud
              </button>

              <button
                onClick={() =>
                  importSkills(
                    ["devops", "devops tools", "devops & tools"],
                    "skillTools"
                  )
                }
                style={S.dbSmallActionBtn}
              >
                DevOps
              </button>

              <button
                onClick={() =>
                  // FIXED: was sending to "skillTools" (Tools & Platforms field) instead of
                  // "skillAI" (the field actually labeled "Cybersecurity" in this form).
                  importSkills(
                    ["cybersecurity", "cyber security", "security"],
                    "skillAI"
                  )
                }
                style={S.dbSmallActionBtn}
              >
                Cybersecurity
              </button>

              <button
                onClick={() =>
                  importSkills(
                    ["tools & platforms", "tools", "platforms"],
                    "skillTools"
                  )
                }
                style={S.dbSmallActionBtn}
              >
                Tools
              </button>

              <button
                onClick={() =>
                  // FIXED: removed stray "Cybersecurity" category (was colliding with the
                  // Cybersecurity button above and pulling unrelated skills into AI/ML).
                  importSkills(
                    ["ai/ml", "ai", "machine learning", "deep learning", "nlp"],
                    "skillAI"
                  )
                }
                style={S.dbSmallActionBtn}
              >
                AI/ML
              </button>
            </div>
          </div>
          <F label="Languages">
            <input style={S.inp} placeholder="Python, Java, C, C++, SQL, JavaScript" value={form.skillLang} onChange={set("skillLang")} />
          </F>
          <F label="Web & Frameworks">
            <input style={S.inp} placeholder="React.js, Node.js, FastAPI, HTML, CSS" value={form.skillWeb} onChange={set("skillWeb")} />
          </F>
          <F label="Cybersecurity">
            <input style={S.inp} placeholder="Machine Learning, Deep Learning, NLP, Generative AI, RAG" value={form.skillAI} onChange={set("skillAI")} />
          </F>
          <F label="Tools & Platforms">
            <input style={S.inp} placeholder="Docker, AWS (EC2, S3), VS Code, Git, MongoDB" value={form.skillTools} onChange={set("skillTools")} />
          </F>
        </Grp>

        {/* Certifications */}
        <Grp label="Certifications">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => toggleImport("certifications")} style={S.dbMiniBtn}>
              <Database size={10} /> {activeImportPanel === "certifications" ? "Close Import Panel" : "Import from DB"}
            </button>
          </div>
          {activeImportPanel === "certifications" && (
            <div style={S.dbDrawer}>
              {dbCertifications.map((c) => (
                <div key={c.id} style={S.dbRowItem}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#fff" }}>{c.title}</p>
                    <p style={{ color: "#aaa" }}>{c.issuer}</p>
                  </div>
                  <button onClick={() => importCertification(c)} style={S.dbActionBtn}>+ Add to Form</button>
                </div>
              ))}
            </div>
          )}

          {certifications.map((cert, i) => (
            <div key={i} style={S.projBlock}>
              <div style={S.projHead}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>Certificate {i + 1}</span>
                {certifications.length > 1 && (
                  <button style={S.removeBtn} onClick={() => removeCertification(i)} aria-label={`Remove certificate ${i + 1}`}>✕</button>
                )}
              </div>
              <Row>
                <F label="Title">
                  <input style={S.inp} placeholder="Generative AI for Beginners" value={cert.title} onChange={(e) => updateCertificationState(i, "title", e.target.value)} />
                </F>
                <F label="Date">
                  <input style={S.inp} placeholder="May 2026" value={cert.date} onChange={(e) => updateCertificationState(i, "date", e.target.value)} />
                </F>
              </Row>
              <Row>
                <F label="Issuing Organization">
                  <input style={S.inp} placeholder="Google" value={cert.issuer} onChange={(e) => updateCertificationState(i, "issuer", e.target.value)} />
                </F>
                <F label="Credential ID (optional)">
                  <input style={S.inp} placeholder="CRED-12345" value={cert.credentialId} onChange={(e) => updateCertificationState(i, "credentialId", e.target.value)} />
                </F>
              </Row>
              <F label="Verification Link URL (optional)">
                <input style={S.inp} placeholder="https://verify.credential.com/123" value={cert.credentialUrl} onChange={(e) => updateCertificationState(i, "credentialUrl", e.target.value)} />
              </F>
            </div>
          ))}
          <button style={S.addBtn} onClick={addCertification}>+ Add Certificate</button>
        </Grp>

        {/* Achievements */}
        <Grp label="Achievements / Competitions">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => toggleImport("achievements")} style={S.dbMiniBtn}>
              <Database size={10} /> {activeImportPanel === "achievements" ? "Close Import Panel" : "Import from DB"}
            </button>
          </div>
          {activeImportPanel === "achievements" && (
            <div style={S.dbDrawer}>
              {dbAchievements.map((a) => (
                <div key={a.id} style={S.dbRowItem}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#fff" }}>{a.title}</p>
                    <p style={{ color: "#aaa" }}>{a.description}</p>
                  </div>
                  <button onClick={() => importAchievement(a)} style={S.dbActionBtn}>+ Add to Form</button>
                </div>
              ))}
            </div>
          )}

          {achievements.map((ach, i) => (
            <div key={i} style={S.projBlock}>
              <div style={S.projHead}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>Achievement {i + 1}</span>
                {achievements.length > 1 && (
                  <button style={S.removeBtn} onClick={() => removeAchievement(i)} aria-label={`Remove achievement ${i + 1}`}>✕</button>
                )}
              </div>
              <Row>
                <F label="Title">
                  <input style={S.inp} placeholder="Google Cloud Career Launchpad" value={ach.title} onChange={(e) => updateAchievementState(i, "title", e.target.value)} />
                </F>
                <F label="Date">
                  <input style={S.inp} placeholder="May 2026" value={ach.date} onChange={(e) => updateAchievementState(i, "date", e.target.value)} />
                </F>
              </Row>
              <F label="Description">
                <textarea
                  style={{ ...S.inp, minHeight: 45, resize: "vertical" }}
                  placeholder="Completed Generative AI Leader Track with distinction..."
                  value={ach.description}
                  onChange={(e) => updateAchievementState(i, "description", e.target.value)}
                />
              </F>
            </div>
          ))}
          <button style={S.addBtn} onClick={addAchievement}>+ Add Achievement</button>
        </Grp>

        <button style={S.dlBtn} onClick={downloadPDF}>⬇ Download PDF</button>
      </div>

      {/* ════════════════ RIGHT: PREVIEW ════════════════ */}
      <div style={S.previewOuter}>
        <div style={S.previewLabel}>Live Preview</div>
        <div style={S.previewScroll}>
          <div ref={previewRef} style={P.page}>
            {!hasContent ? (
              <div style={{ textAlign: "center", color: "#ccc", paddingTop: 80, fontSize: 13, fontFamily: "sans-serif" }}>
                Fill in the form to see your resume →
              </div>
            ) : (
              <>
                {/* ── HEADER ── */}
                <div style={P.header}>
                  {form.name && <div style={P.name}>{form.name}</div>}
                  <div style={P.contactLine}>
                    {contactItems.map((item, i) => (
                      <React.Fragment key={i}>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer" style={P.link}>
                            {item.text}
                          </a>
                        ) : (
                          <span>{item.text}</span>
                        )}
                        {i < contactItems.length - 1 && (
                          <span style={{ margin: "0 5px", color: "#888" }}>|</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* ── PROFESSIONAL SUMMARY ── */}
                {!empty(form.objective) && (
                  <Sec title="Professional Summary">
                    <p style={{ ...P.body, marginTop: 2 }}>{form.objective}</p>
                  </Sec>
                )}

                {/* ── EDUCATION ── */}
                {(!empty(form.eduDegree) || !empty(form.edu2Degree) || !empty(form.edu3Degree)) && (
                  <Sec title="Education">
                    {!empty(form.eduDegree) && (
                      <div style={P.eduRow}>
                        <div>
                          <em style={P.body}>{form.eduDegree}</em>
                          {form.eduCollege && <div style={P.body}>{form.eduCollege}</div>}
                          {(form.eduGpa || form.eduPercentage) && <div style={P.body}>{educationScoreLabel(form.eduGpa, form.eduPercentage)}</div>}
                        </div>
                        <div style={P.rightCol}>
                          {form.eduLocation && <div>{form.eduLocation}</div>}
                          {form.eduYear && <div>{form.eduYear}</div>}
                        </div>
                      </div>
                    )}
                    {!empty(form.edu2Degree) && (
                      <div style={P.eduRow}>
                        <div>
                          <em style={P.body}>{form.edu2Degree}</em>
                          {form.edu2College && <div style={P.body}>{form.edu2College}</div>}
                          {(form.edu2Gpa || form.edu2Percentage) && <div style={P.body}>{educationScoreLabel(form.edu2Gpa, form.edu2Percentage)}</div>}
                        </div>
                        <div style={P.rightCol}>
                          {form.edu2Year && <div>{form.edu2Year}</div>}
                        </div>
                      </div>
                    )}
                    {!empty(form.edu3Degree) && (
                      <div style={P.eduRow}>
                        <div>
                          <em style={P.body}>{form.edu3Degree}</em>
                          {form.edu3College && <div style={P.body}>{form.edu3College}</div>}
                          {(form.edu3Gpa || form.edu3Percentage) && <div style={P.body}>{educationScoreLabel(form.edu3Gpa, form.edu3Percentage)}</div>}
                        </div>
                        <div style={P.rightCol}>
                          {form.edu3Year && <div>{form.edu3Year}</div>}
                        </div>
                      </div>
                    )}
                  </Sec>
                )}

                {/* ── EXPERIENCE ── */}
                {!empty(form.experience) && (
                  <Sec title="Experience">
                    <ExpBlocks raw={form.experience} />
                  </Sec>
                )}

                {/* ── PROJECTS ── */}
                {filledProjects.length > 0 && (
                  <Sec title="Projects">
                    {filledProjects.map((proj, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        {/* Title row: name | tech stack + date */}
                        <div style={P.projTitleRow}>
                          <span>
                            <strong>{proj.title}</strong>
                            {proj.tech && (
                              <em style={{ fontWeight: "normal" }}> | {proj.tech}</em>
                            )}
                            {/* project links inline after tech */}
                            {(proj.liveUrl || proj.repoUrl) && (
                              <span style={{ fontWeight: "normal", fontStyle: "normal" }}>
                                {proj.liveUrl && (
                                  <>
                                    {" "}|{" "}
                                    <a
                                      href={toUrl(proj.liveUrl)}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={P.link}
                                    >
                                      Live Demo
                                    </a>
                                  </>
                                )}
                                {proj.repoUrl && (
                                  <>
                                    {" "}|{" "}
                                    <a
                                      href={toUrl(proj.repoUrl)}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={P.link}
                                    >
                                      GitHub
                                    </a>
                                  </>
                                )}
                              </span>
                            )}
                          </span>
                          {proj.date && (
                            <span style={P.dateRight}>{proj.date}</span>
                          )}
                        </div>
                        {/* Bullets */}
                        {proj.bullets && (
                          <ul style={P.ul}>
                            {proj.bullets
                              .split("\n")
                              .filter((l) => l.trim())
                              .map((line, j) => (
                                <li key={j} style={P.li}>
                                  {line.replace(/^[-•*]\s*/, "")}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </Sec>
                )}

                {/* ── TECHNICAL SKILLS ── */}
                {skillLines.length > 0 && (
                  <Sec title="Skills">
                    {skillLines.map((sk, i) => (
                      <div key={i} style={P.body}>
                        <strong>{sk.label}</strong>: {sk.val}
                      </div>
                    ))}
                  </Sec>
                )}

                {/* ── CERTIFICATIONS ── */}
                {certifications.filter(c => c.title).length > 0 && (
                  <Sec title="Certifications">
                    {certifications
                      .filter(c => c.title)
                      .map((c, i) => {
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                            <div style={P.body}>
                              <strong>{c.title}</strong>
                              {c.issuer && ` – ${c.issuer}`}
                              {c.credentialId && ` (ID: ${c.credentialId})`}
                              {c.credentialUrl && (
                                <>
                                  {" "}|{" "}
                                  <a href={toUrl(c.credentialUrl)} target="_blank" rel="noreferrer" style={P.link}>Verify</a>
                                </>
                              )}
                            </div>
                            {c.date && <span style={P.dateRight}>{c.date}</span>}
                          </div>
                        );
                      })}
                  </Sec>
                )}

                {/* ── ACHIEVEMENTS ── */}
                {achievements.filter(a => a.title).length > 0 && (
                  <Sec title="Achievements">
                    {achievements
                      .filter(a => a.title)
                      .map((a, i) => {
                        return (
                          <div key={i} style={{ marginBottom: 4 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <strong style={P.body}>{a.title}</strong>
                              {a.date && <span style={P.dateRight}>{a.date}</span>}
                            </div>
                            {a.description && <p style={{ ...P.body, marginTop: 1 }}>{a.description}</p>}
                          </div>
                        );
                      })}
                  </Sec>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #eef0f3; font-family: 'Segoe UI', sans-serif; }
        input::placeholder, textarea::placeholder { color: #c5c5c5; }
        input:focus, textarea:focus { outline: none; border-color: #888; background: #fff; }
        button:active { opacity: 0.8; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

        /* Responsive: stack form and preview on narrower screens */
        @media (max-width: 900px) {
          .resume-root { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Experience block parser ─────────────────────────────────────────────── */
function ExpBlocks({ raw }: { raw: string }) {
  const blocks = raw.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (!lines.length) return null;
        const parts = lines[0].split("|").map((s) => s.trim());
        const role = parts[0] || "";
        const company = parts[1] || "";
        const location = parts[2] || "";
        const date = parts[3] || "";
        const bullets = lines.slice(1);
        return (
          <div key={i} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong style={{ fontSize: 10 }}>{role}</strong>
              <span style={{ fontSize: 10, color: "#333", whiteSpace: "nowrap" }}>{date}</span>
            </div>
            {company && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#333" }}>
                <em>{company}</em>
                <span>{location}</span>
              </div>
            )}
            {bullets.length > 0 && (
              <ul style={{ margin: "3px 0 0", paddingLeft: 16 }}>
                {bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: 10, lineHeight: 1.65, color: "#222" }}>
                    {b.replace(/^[-•*]\s*/, "")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={P.secTitle}>{title}</div>
      {children}
    </div>
  );
}

/* ── Form helpers ────────────────────────────────────────────────────────── */
function Grp({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={S.grp}>
      <div style={S.grpLabel}>{label}</div>
      {children}
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8, flex: 1, minWidth: 0 }}>
      <label style={S.lbl}>{label}</label>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 8 }}>{children}</div>;
}

/* ── Form styles ─────────────────────────────────────────────────────────── */
const S = {
  root: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    padding: 14,
    minHeight: "100vh",
    background: "#eef0f3",
    alignItems: "start",
  },
  formPanel: {
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e2e2e2",
    padding: "18px 18px 22px",
    overflowY: "auto" as const,
    maxHeight: "95vh",
  },
  panelTitle: { fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 14 },
  grp: { borderTop: "1px solid #f0f0f0", paddingTop: 12, marginBottom: 4 },
  grpLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#aaa",
    marginBottom: 8,
  },
  lbl: { fontSize: 11, color: "#777", display: "block", marginBottom: 3 },
  inp: {
    width: "100%",
    padding: "6px 9px",
    border: "1px solid #e0e0e0",
    borderRadius: 7,
    fontSize: 12,
    fontFamily: "inherit",
    color: "#111",
    background: "#fafafa",
  },
  subGrp: {
    background: "#f9f9f9",
    border: "1px solid #ebebeb",
    borderRadius: 8,
    padding: "8px 10px",
    marginBottom: 8,
  },
  subLabel: { fontSize: 10, fontWeight: 600, color: "#bbb", marginBottom: 6 },
  projBlock: {
    border: "1px solid #ececec",
    borderRadius: 9,
    padding: "10px 12px",
    marginBottom: 10,
    background: "#fafafa",
  },
  projHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  removeBtn: { background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 },
  addBtn: {
    width: "100%",
    background: "none",
    border: "1px dashed #ddd",
    borderRadius: 7,
    padding: "7px 12px",
    fontSize: 11,
    color: "#aaa",
    cursor: "pointer",
    marginTop: 2,
  },
  dlBtn: {
    width: "100%",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    padding: "11px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 18,
    letterSpacing: "0.02em",
  },
  previewOuter: { position: "sticky" as const, top: 14 },
  previewLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    color: "#bbb",
    marginBottom: 6,
  },
  previewScroll: {
    overflowY: "auto" as const,
    maxHeight: "95vh",
    borderRadius: 10,
    boxShadow: "0 2px 18px rgba(0,0,0,0.09)",
  },
  dbMiniBtn: {
    background: "none",
    border: "none",
    color: "#a78bfa",
    cursor: "pointer",
    fontSize: 11,
    padding: 0,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  syncBtn: {
    background: "rgba(124, 58, 237, 0.08)",
    color: "#7c3aed",
    border: "1px solid rgba(124, 58, 237, 0.22)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 11,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontWeight: 600,
  },
  dbDrawer: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    maxHeight: 180,
    overflowY: "auto" as const,
  },
  dbRowItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #333",
    fontSize: 11,
    gap: 10,
  },
  dbActionBtn: {
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  dbSmallActionBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 5,
    padding: "2px 6px",
    fontSize: 9,
    cursor: "pointer",
    color: "#ccc",
  },
};

/* ── Preview / PDF styles ────────────────────────────────────────────────── */
const P = {
  page: {
    background: "#ffffff",
    padding: "28px 34px",
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: 10,
    color: "#111",
    lineHeight: 1.5,
    minHeight: 640,
  },
  header: {
    textAlign: "center" as const,
    borderBottom: "1.5px solid #111",
    paddingBottom: 6,
    marginBottom: 2,
  },
  name: {
    fontSize: 19,
    fontWeight: "bold" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 4,
    fontFamily: "'Times New Roman', serif",
  },
  contactLine: {
    fontSize: 9.5,
    color: "#333",
    lineHeight: 1.8,
    display: "flex",
    flexWrap: "wrap" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 0,
  },
  link: {
    color: "#0f0f0f",
    textDecoration: "underline",
    fontSize: "inherit",
  },
  secTitle: {
    fontSize: 11,
    fontWeight: "bold" as const,
    fontVariant: "small-caps" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid #111",
    paddingBottom: 2,
    marginTop: 10,
    marginBottom: 5,
    color: "#111",
    fontFamily: "'Times New Roman', serif",
  },
  body: { fontSize: 10, color: "#222", lineHeight: 1.6, margin: 0 },
  eduRow: {
    display: "flex",
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 4,
  },
  rightCol: {
    textAlign: "right" as const,
    whiteSpace: "nowrap" as const,
    marginLeft: 12,
    fontSize: 10,
    color: "#333",
    lineHeight: 1.6,
  },
  projTitleRow: {
    display: "flex",
    justifyContent: "space-between" as const,
    alignItems: "baseline" as const,
    fontSize: 10,
    marginBottom: 2,
  },
  dateRight: { fontSize: 10, color: "#333", whiteSpace: "nowrap" as const, marginLeft: 8 },
  ul: { margin: "3px 0 0", paddingLeft: 16 },
  li: { fontSize: 10, lineHeight: 1.65, color: "#222", marginBottom: 1 },
};