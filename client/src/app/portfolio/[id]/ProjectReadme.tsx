"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface Props {
  content: string;
  repoUrl?: string | null;
}

export default function ProjectReadme({ content, repoUrl }: Props) {
  // Pre-process: fix relative image paths to use GitHub raw URLs
  let processed = content;
  if (repoUrl) {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const rawBase = `https://raw.githubusercontent.com/${match[1]}/${match[2]}/HEAD`;
      // Replace relative image srcs (not starting with http/https)
      processed = processed.replace(
        /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
        (_, alt, src) => `![${alt}](${rawBase}/${src.replace(/^\.?\//, "")})`
      );
    }
  }

  const components: Components = {
    // Headings
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-white mt-8 mb-4 pb-3 border-b border-white/10 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-white/90 mt-7 mb-3 pb-2 border-b border-white/8">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-white/85 mt-5 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold text-white/80 mt-4 mb-2">{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-sm font-semibold text-white/75 mt-3 mb-1">{children}</h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-sm font-medium text-white/60 mt-3 mb-1">{children}</h6>
    ),

    // Paragraph
    p: ({ children }) => (
      <p className="text-[15px] text-white/65 leading-7 mb-4">{children}</p>
    ),

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-violet-400 hover:text-violet-300 underline underline-offset-2 decoration-violet-500/40 hover:decoration-violet-400 transition-colors"
      >
        {children}
      </a>
    ),

    // Inline code
    code: ({ children, className }) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        // Block code — handled by pre
        return (
          <code className="text-[13px] font-mono text-emerald-300">{children}</code>
        );
      }
      return (
        <code className="rounded-md bg-white/8 px-1.5 py-0.5 text-[13px] font-mono text-violet-300 border border-white/6">
          {children}
        </code>
      );
    },

    // Code blocks
    pre: ({ children }) => (
      <pre className="overflow-x-auto rounded-xl border border-white/8 bg-black/40 p-4 mb-4 text-[13px] font-mono leading-6 text-emerald-300/90">
        {children}
      </pre>
    ),

    // Blockquote
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-violet-500/50 pl-4 mb-4 text-white/50 italic">
        {children}
      </blockquote>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="mb-4 space-y-1.5 list-none pl-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 space-y-1.5 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="flex items-start gap-2 text-[15px] text-white/65 leading-6">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500/60 flex-shrink-0" />
        <span>{children}</span>
      </li>
    ),

    // Horizontal rule
    hr: () => <hr className="border-white/8 my-6" />,

    // Images
    img: ({ src, alt }) => {
      if (!src) return null;
      return (
        <span className="block my-4">
          <img
            src={src}
            alt={alt || ""}
            className="rounded-xl border border-white/8 max-w-full mx-auto shadow-lg"
            loading="lazy"
          />
          {alt && (
            <span className="block text-center text-xs text-white/30 mt-2">{alt}</span>
          )}
        </span>
      );
    },

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-white/10">{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-white/6 hover:bg-white/[0.02] transition">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2.5 text-[14px] text-white/60">{children}</td>
    ),

    // Strong / Em
    strong: ({ children }) => (
      <strong className="font-semibold text-white/90">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-white/70">{children}</em>,

    // Delete / Strikethrough
    del: ({ children }) => (
      <del className="line-through text-white/35">{children}</del>
    ),
  };

  return (
    <div className="px-6 py-8 md:px-8">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
