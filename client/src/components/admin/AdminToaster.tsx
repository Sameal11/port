"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import {
  ADMIN_ERROR_EVENT,
  ADMIN_NOTICE_EVENT,
  type AdminErrorDetail,
} from "@/lib/adminApi";

type Toast = { id: number; tone: "error" | "success"; message: string };

/**
 * Shows every failed admin API call (and explicit `notify()` messages) as a
 * toast, so a failed load never silently looks like "no data". An expired
 * session sends the user back to the login page.
 */
export default function AdminToaster() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    function push(tone: Toast["tone"], message: string) {
      const id = ++nextId.current;
      setToasts((list) =>
        // Collapse repeats (a page often fires several requests at once).
        list.some((t) => t.message === message) ? list : [...list.slice(-2), { id, tone, message }]
      );
      window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === "error" ? 7000 : 3500);
    }

    function onError(event: Event) {
      const { message, status } = (event as CustomEvent<AdminErrorDetail>).detail;
      push("error", message);
      if (status === 401) {
        window.setTimeout(() => router.replace("/login"), 1200);
      }
    }

    function onNotice(event: Event) {
      push("success", (event as CustomEvent<string>).detail);
    }

    window.addEventListener(ADMIN_ERROR_EVENT, onError);
    window.addEventListener(ADMIN_NOTICE_EVENT, onNotice);
    return () => {
      window.removeEventListener(ADMIN_ERROR_EVENT, onError);
      window.removeEventListener(ADMIN_NOTICE_EVENT, onNotice);
    };
  }, [router]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
            t.tone === "error"
              ? "border-red-500/25 bg-[#1a0d0d]/95 text-red-200"
              : "border-emerald-500/25 bg-[#0c1712]/95 text-emerald-200"
          }`}
        >
          {t.tone === "error" ? (
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          )}
          <p className="flex-1 leading-relaxed">{t.message}</p>
          <button
            type="button"
            onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            className="rounded-md p-0.5 opacity-60 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
