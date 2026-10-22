"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TextType from "@/components/band/TextType";
import { Download, ArrowUpRight } from "lucide-react";
import type {
  PortfolioPersonalInfo,
  PortfolioSkill,
  PortfolioResumeLink,
} from "@/lib/portfolioService";

type Props = {
  personalInfo: PortfolioPersonalInfo | null;
  skills: PortfolioSkill[];
  loading: boolean;
  resumeLinks?: PortfolioResumeLink[];
};

export default function Hero({ personalInfo, skills, resumeLinks = [] }: Props) {
  const [startAnim, setStartAnim] = useState(false);

  useEffect(() => {
    const heroPlayed = sessionStorage.getItem("heroPlayed");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (heroPlayed === "true" || reducedMotion) {
      const frame = requestAnimationFrame(() => {
        setStartAnim(true);
      });

      return () => cancelAnimationFrame(frame);
    }

    // Starts as the (shortened) welcome screen slides away.
    const delay = 1700;

    const textTimer = setTimeout(() => {
      setStartAnim(true);
    }, delay);

    const appTimer = setTimeout(() => {
      sessionStorage.setItem("heroPlayed", "true");
    }, delay + 1500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(appTimer);
    };
  }, []);

  const skillLabels = skills
    .map((skill) => skill.name)
    .filter(Boolean)
    .slice(0, 3);

  const rotatingTitles = personalInfo?.hero_rotating_titles || [];

  const [downloading, setDownloading] = useState(false);

  const primaryResumeLink =
    resumeLinks.find((link) => link.is_primary) || resumeLinks[0] || null;

  const handleDownloadResume = async () => {
    if (!primaryResumeLink?.url) return;
    setDownloading(true);
    try {
      const response = await fetch(primaryResumeLink.url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = primaryResumeLink.label || "resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed, opening in new tab:", error);
      window.open(primaryResumeLink.url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const scrollToPortfolio = () => {
    const el = document.getElementById("portfolio");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Setup Orbiting Skills
  const orbitSkills = skills.slice(0, 12);
  const defaultSkills = [
    { name: "React", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
    { name: "TypeScript", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" },
    { name: "Python", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
    { name: "Node.js", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
    { name: "Docker", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" },
    { name: "AWS", logo_url: "https://raw.githubusercontent.com/github/explore/fb2b3b7784cdf77da0b13d1159fc58a625e1d607/topics/aws/aws.png" },
    { name: "Git", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
    { name: "PostgreSQL", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" },
    { name: "MongoDB", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" },
    { name: "FastAPI", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" },
    { name: "Java", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" },
    { name: "CSS3", logo_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" },
  ];

  const displayedSkills = [...orbitSkills];
  let defaultIdx = 0;
  while (displayedSkills.length < 12 && defaultIdx < defaultSkills.length) {
    const nextDefault = defaultSkills[defaultIdx++];
    if (!displayedSkills.some(s => s.name.toLowerCase() === nextDefault.name.toLowerCase())) {
      displayedSkills.push({
        id: `default-${displayedSkills.length}`,
        name: nextDefault.name,
        logo_url: nextDefault.logo_url,
        category: "Default",
      });
    }
  }

  const rings = [
    {
      radius: 80,
      skills: displayedSkills.slice(0, 3),
      duration: 20,
      direction: "cw",
    },
    {
      radius: 140,
      skills: displayedSkills.slice(3, 7),
      duration: 28,
      direction: "ccw",
    },
    {
      radius: 200,
      skills: displayedSkills.slice(7, 12),
      duration: 36,
      direction: "cw",
    },
  ];

  return (
    <section
      id="home"
      className="px-6 md:pl-[120px] md:pr-[60px] w-full"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
        overflow: "hidden",
        // Clears the fixed navbar (~66px) with breathing room.
        paddingTop: "clamp(104px, 14vh, 150px)",
        paddingBottom: "clamp(60px, 8vh, 100px)",
        boxSizing: "border-box",
      }}
    >
      {/* Background Radial Glow */}
      <div 
        style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: "45vw",
          height: "45vw",
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.03) 50%, rgba(0, 0, 0, 0) 100%)",
          zIndex: 0,
          pointerEvents: "none",
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 40,
          zIndex: 5,
        }}
        className="flex-col lg:flex-row"
      >
        {/* Left Side (Text content) */}
        <div
          className="w-full lg:max-w-[580px]"
          style={{
            position: "relative",
            zIndex: 5,
          }}
        >
          <motion.div
            initial={false}
            animate={
              startAnim
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: 30, filter: "blur(12px)" }
            }
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 20 }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: "var(--text-muted)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {personalInfo?.availability_text || ""}
            </span>
          </motion.div>

          <div>
            <motion.h1
              initial={false}
              animate={
                startAnim
                  ? { opacity: 1, scale: 1, y: 0 }
                  : { opacity: 0, scale: 0.85, y: 50 }
              }
              transition={{
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                fontSize: "clamp(38px, 7vw, 68px)",
                fontWeight: 800,
                lineHeight: 1.02,
                color: "var(--text-primary)",
                textWrap: "balance",
                letterSpacing: "-0.03em",
                marginBottom: 0,
              }}
            >
              {personalInfo?.hero_title_primary || ""}
            </motion.h1>

            <motion.p
              initial={false}
              animate={
                startAnim
                  ? { opacity: 1, x: 0, rotate: 0 }
                  : { opacity: 0, x: -30, rotate: 0 }
              }
              transition={{
                duration: 1,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                fontSize: "clamp(22px, 3.6vw, 40px)",
                fontWeight: 800,
                lineHeight: 1.15,
                color: "var(--text-secondary)",
                textWrap: "balance",
                overflowWrap: "anywhere",
                marginTop: 10,
                letterSpacing: "-0.03em",
                marginBottom: 24,
              }}
            >
              {personalInfo?.hero_title_secondary || ""}
            </motion.p>
          </div>

          <motion.div
            initial={false}
            animate={startAnim ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            style={{ marginBottom: 12 }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 15,
                color: "var(--text-secondary)",
                letterSpacing: "0.1em",
              }}
            >
              {rotatingTitles.length > 0 ? (
                <TextType
                  text={rotatingTitles}
                  typingSpeed={75}
                  pauseDuration={1500}
                  showCursor
                  cursorCharacter="_"
                  deletingSpeed={50}
                  cursorBlinkDuration={0.5}
                />
              ) : null}
            </span>
          </motion.div>

          <motion.div
            initial={false}
            animate={
              startAnim
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 50, scale: 0.96 }
            }
            transition={{ duration: 1, delay: 0.5 }}
            style={{
              marginBottom: 28,
              width: "100%",
              maxWidth: 520,
            }}
          >
            {personalInfo?.tagline && (
              <p
                style={{
                  fontSize: "clamp(15px, 2vw, 17px)",
                  fontWeight: 600,
                  color: "#a78bfa",
                  marginBottom: 10,
                  lineHeight: 1.4,
                  letterSpacing: "-0.01em",
                }}
              >
                {personalInfo.tagline}
              </p>
            )}
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.9,
                letterSpacing: "0.01em",
                textWrap: "pretty",
              }}
            >
              {personalInfo?.bio || personalInfo?.hero_description || ""}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={startAnim ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.7,
                },
              },
            }}
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            {skillLabels.map((skill) => (
              <motion.span
                key={skill}
                variants={{
                  hidden: { opacity: 0, y: 25, scale: 0.85 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ duration: 0.5 }}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  padding: "5px 12px",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                {skill}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            initial={false}
            animate={startAnim ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginTop: 12,
              marginBottom: 28,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={scrollToPortfolio}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                backdropFilter: "blur(4px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              View Projects
              <ArrowUpRight size={14} />
            </button>

            {primaryResumeLink && (
              <button
                onClick={handleDownloadResume}
                disabled={downloading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 12,
                  border: "1px solid var(--accent, #7c3aed)",
                  background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: downloading ? "not-allowed" : "pointer",
                  transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                  boxShadow: "0 4px 20px rgba(124, 58, 237, 0.25)",
                }}
                onMouseEnter={(e) => {
                  if (!downloading) {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(124, 58, 237, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!downloading) {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(124, 58, 237, 0.25)";
                  }
                }}
              >
                {downloading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <Download size={14} />
                )}
                {downloading ? "Downloading..." : "Download Resume"}
              </button>
            )}
          </motion.div>

          <motion.div
            initial={false}
            animate={startAnim ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
            transition={{ duration: 0.8, delay: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              {personalInfo?.hero_footer_primary || ""}
            </span>

            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              {personalInfo?.hero_footer_secondary || ""}
            </span>
          </motion.div>
        </div>

        {/* Right Side (Skills Orbit) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={startAnim ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-[calc(50%-20px)] flex justify-center items-center"
          style={{
            position: "relative",
            minHeight: 450,
            zIndex: 5,
          }}
        >
          <div 
            style={{
              position: "relative",
              width: 440,
              height: 440,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            className="sm:scale-100 scale-75"
          >
            {/* Inject self-contained keyframe styles */}
            <style>{`
              @keyframes orbit-rotate-cw {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes orbit-rotate-ccw {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(-360deg); }
              }
              @keyframes core-pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 25px rgba(124, 58, 237, 0.25); }
                50% { transform: scale(1.06); box-shadow: 0 0 45px rgba(6, 182, 212, 0.45); }
              }
              .orbit-ring {
                border: 1px dashed rgba(255, 255, 255, 0.08);
                position: absolute;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: border-color 0.3s;
              }
              .orbit-ring:hover {
                border-color: rgba(124, 58, 237, 0.2);
              }
              .orbit-item {
                position: absolute;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(15, 15, 25, 0.7);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
              }
              .orbit-item:hover {
                background: rgba(124, 58, 237, 0.15);
                border-color: rgba(6, 182, 212, 0.6);
                box-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
                transform: translate(-50%, -50%) scale(1.2) !important;
                z-index: 50;
              }
              .orbit-item img {
                width: 22px;
                height: 22px;
                object-fit: contain;
                pointer-events: none;
              }
              .orbit-text-fallback {
                font-family: 'DM Mono', monospace;
                font-size: 11px;
                font-weight: 700;
                color: #c084fc;
                pointer-events: none;
              }
              .orbit-tooltip {
                position: absolute;
                bottom: 120%;
                left: 50%;
                transform: translateX(-50%) translateY(4px);
                background: rgba(10, 10, 15, 0.95);
                border: 1px solid rgba(124, 58, 237, 0.4);
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 10px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.6);
                font-family: 'DM Mono', monospace;
              }
              .orbit-item:hover .orbit-tooltip {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
              .orbit-ring-cw {
                animation: orbit-rotate-cw var(--ring-dur) linear infinite;
              }
              .orbit-ring-ccw {
                animation: orbit-rotate-ccw var(--ring-dur) linear infinite;
              }
              .orbit-item-cw {
                animation: orbit-rotate-cw var(--ring-dur) linear infinite;
              }
              .orbit-item-ccw {
                animation: orbit-rotate-ccw var(--ring-dur) linear infinite;
              }
              .orbit-ring:hover {
                animation-play-state: paused;
              }
              .orbit-ring:hover .orbit-item {
                animation-play-state: paused;
              }
            `}</style>

            {/* Central Glow Core */}
            <div 
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(124, 58, 237, 0.8) 0%, rgba(6, 182, 212, 0.8) 100%)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
                animation: "core-pulse 4s ease-in-out infinite",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 0 25px rgba(124, 58, 237, 0.4)",
              }}
            >
              <span 
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: "'DM Mono', monospace",
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                {personalInfo?.brand_name?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>

            {/* Concentric Rings */}
            {rings.map((ring, ringIdx) => {
              const ringSize = ring.radius * 2;
              const isCw = ring.direction === "cw";
              return (
                <div
                  key={ringIdx}
                  className={`orbit-ring ${isCw ? "orbit-ring-cw" : "orbit-ring-ccw"}`}
                  style={{
                    width: ringSize,
                    height: ringSize,
                    ["--ring-dur" as any]: `${ring.duration}s`,
                  }}
                >
                  {/* Skill Badges */}
                  {ring.skills.map((skill, skillIdx) => {
                    const count = ring.skills.length;
                    const theta = (360 / count) * skillIdx;
                    const x = ring.radius * Math.cos((theta * Math.PI) / 180);
                    const y = ring.radius * Math.sin((theta * Math.PI) / 180);

                    const xVal = parseFloat(x.toFixed(3));
                    const yVal = parseFloat(y.toFixed(3));
                    const leftVal = xVal >= 0 ? `calc(50% + ${xVal}px)` : `calc(50% - ${Math.abs(xVal)}px)`;
                    const topVal = yVal >= 0 ? `calc(50% + ${yVal}px)` : `calc(50% - ${Math.abs(yVal)}px)`;

                    return (
                      <div
                        key={skill.id}
                        className={`orbit-item ${isCw ? "orbit-item-ccw" : "orbit-item-cw"}`}
                        style={{
                          left: leftVal,
                          top: topVal,
                          transform: "translate(-50%, -50%)",
                          ["--ring-dur" as any]: `${ring.duration}s`,
                        }}
                      >
                        {skill.logo_url ? (
                          <img src={skill.logo_url} alt={skill.name} />
                        ) : (
                          <span className="orbit-text-fallback">
                            {skill.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="orbit-tooltip">{skill.name}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={false}
        animate={startAnim ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{
          duration: 0.9,
          delay: 1.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          position: "absolute",
          bottom: 38,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={false}
          animate={
            startAnim
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 40 }
          }
          transition={{
            duration: 0.9,
            delay: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full flex justify-center"
        >
          <motion.div
            animate={{
              y: [0, 6, 0],
              opacity: [1, 0.65, 1],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center justify-center gap-2"
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Scroll
            </span>

            <span
              style={{
                fontSize: 16,
                color: "var(--text-secondary)",
                lineHeight: 1,
              }}
            >
              ↓
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
