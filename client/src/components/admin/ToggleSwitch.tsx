"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  size?: "sm" | "md";
}

export default function ToggleSwitch({ checked, onChange, label, size = "md" }: ToggleSwitchProps) {
  const h = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const dot = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const translate = size === "sm" ? "translate-x-4" : "translate-x-5";

  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 ${h} items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
          checked ? "bg-violet-600" : "bg-white/15"
        }`}
      >
        <span
          className={`inline-block ${dot} transform rounded-full bg-white shadow transition-transform ${
            checked ? translate : "translate-x-1"
          }`}
        />
      </button>
      {label && <span className="text-sm text-white/70">{label}</span>}
    </label>
  );
}
