"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  Code,
  Award,
  Globe,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import type {
  PortfolioAboutInfo,
  PortfolioResumeLink,
} from "@/lib/portfolioService";

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.16,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 35, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: 70, rotate: 2 },
  show: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const pop: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 25 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

type Props = {
  about: PortfolioAboutInfo | null;
  projectsCount: number;
  certificationsCount: number;
  achievementsCount: number;
  experienceCount: number;
  skillsCount?: number;
  resumeLinks: PortfolioResumeLink[];
  loading: boolean;
};

/** Event PortfolioShowcase listens for, so stat cards can open a specific tab. */
export const PORTFOLIO_TAB_EVENT = "portfolio:tab";

export default function About({
  about,
  projectsCount,
  certificationsCount,
  skillsCount = 0,
  resumeLinks,
}: Props) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  const openPortfolioTab = (tab: string) => {
    window.dispatchEvent(new CustomEvent(PORTFOLIO_TAB_EVENT, { detail: tab }));
    document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isMobile === null) return null;

  const stats = [
    { icon: <Code size={16} />, value: String(projectsCount), title: "Projects", tab: "projects" },
    { icon: <Award size={16} />, value: String(certificationsCount), title: "Certificates", tab: "certificates" },
    { icon: <Globe size={16} />, value: String(skillsCount), title: "Technologies", tab: "techstack" },
  ];

  return (
    <section
      id="about"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        padding: isMobile ? "60px 24px 30px" : "80px 60px 30px 120px",
      }}
    >
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            style={{
              maxWidth: "600px",
              width: "100%",
            }}
          >
            <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  letterSpacing: "0.2em",
                }}
              >
                ABOUT ME
              </span>
            </motion.div>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 1.1,
                    delay: 0.2,
                  },
                },
              }}
              style={{
                marginTop: 18,
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.75,
                maxWidth: isMobile ? "100%" : "490px",
              }}
            >
              {about?.description || ""}
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.94 },
                show: {
                  opacity: 1,
                  scale: 1,
                  transition: {
                    duration: 0.9,
                    delay: 0.3,
                  },
                },
              }}
              style={{
                marginTop: 18,
                padding: "12px 25px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                fontSize: 12,
                fontStyle: "italic",
                display: about?.quote ? "inline-block" : "none",
                width: "fit-content",
              }}
            >
              {about?.quote}
            </motion.div>

            <motion.div
              variants={fadeUp}
              style={{
                marginTop: 28,
                marginBottom: 10,
                width: "100%",
              }}
            >
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                How I work
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  width: "100%",
                }}
              >
                {[
                  {
                    title: "Tools that remove friction",
                    desc: "Find the real problem behind \"this is slow\" and ship a small, deployed tool for it, like an offline file converter or a dashboard that turns raw reports into something readable.",
                    glow: "rgba(124, 58, 237, 0.08)",
                    border: "rgba(124, 58, 237, 0.15)",
                  },
                  {
                    title: "AI in the workflow",
                    desc: "LLM tool use, chained workflows and packaged AI skills: AI wired into how people already work, not bolted on as a demo.",
                    glow: "rgba(6, 182, 212, 0.08)",
                    border: "rgba(6, 182, 212, 0.15)",
                  },
                  {
                    title: "Design sensibility",
                    desc: "Grounded in design-system study (Material 3, HIG, Fluent, Carbon) and a 20-point UX review I run before calling anything done.",
                    glow: "rgba(236, 72, 153, 0.07)",
                    border: "rgba(236, 72, 153, 0.15)",
                  },
                ].map((pillar, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 6, backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 14,
                      border: `1px solid ${pillar.border}`,
                      background: `linear-gradient(135deg, ${pillar.glow} 0%, rgba(255,255,255,0.01) 100%)`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
                      {pillar.title}
                    </span>
                    <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {pillar.desc}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            style={{
              width: isMobile ? "100%" : "48%",
              display: "flex",
              justifyContent: isMobile ? "center" : "flex-end",
              order: isMobile ? -1 : 1,
              marginBottom: isMobile ? "24px" : "0px",
            }}
          >
            <div
              style={{
                padding: isMobile ? 8 : 12,
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.15)",
                transform: isMobile ? "none" : "translateX(-40px)",
                transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className="hover:scale-[1.03] hover:border-violet-500/30"
            >
              <img
                src={about?.profile_image_url || "/assets/pp.png"}
                alt={about?.profile_image_url ? "Portrait photo" : "Profile placeholder"}
                width={3024}
                height={4032}
                style={{
                  width: isMobile ? 220 : 280,
                  height: isMobile ? 220 : 280,
                  borderRadius: "50%",
                  objectFit: "cover",
                  objectPosition: "center 30%",
                  display: "block",
                }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 18,
            marginTop: 36,
          }}
        >
          {stats.map((item, i) => (
            <motion.button
              type="button"
              key={i}
              variants={pop}
              whileHover={{ scale: 1.03 }}
              onClick={() => openPortfolioTab(item.tab)}
              aria-label={`${item.value} ${item.title}: view in portfolio`}
              className="text-left text-white transition-colors hover:border-white/25"
              style={{
                position: "relative",
                padding: 18,
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                {item.icon}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: "'DM Mono', monospace",
                  color: "var(--text-secondary)",
                }}
              >
                {item.title}
              </div>

              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: 14,
                  right: 14,
                  color: "var(--text-secondary)",
                }}
              >
                <ArrowUpRight size={15} />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
