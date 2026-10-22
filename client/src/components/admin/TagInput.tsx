"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function TagInput({ value = [], onChange, placeholder = "Type and press Enter", label }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(input); }
    else if (e.key === "Backspace" && !input && value.length) removeTag(value[value.length - 1]);
    else if (e.key === ",") { e.preventDefault(); addTag(input); }
  };

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</p>}
      <div
        className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 cursor-text focus-within:border-violet-500/50 transition"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-lg bg-violet-500/20 px-2.5 py-1 text-xs text-violet-300"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => input && addTag(input)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-24 flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
        />
      </div>
      <p className="text-xs text-white/25">Press Enter or comma to add tags</p>
    </div>
  );
}
