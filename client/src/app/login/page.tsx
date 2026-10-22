"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#2a2a2a_0%,#111111_35%,#080808_100%)] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-[linear-gradient(160deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-8 md:p-12">
            <div className="space-y-6">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/55">
                Portfolio Admin
              </p>
              <h1 className="max-w-md text-4xl font-semibold leading-tight md:text-5xl">
                Manage your portfolio content from one place.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-white/68 md:text-base">
                Sign in with your Supabase user account to add
                projects, certificates, and skills without opening
                the database manually.
              </p>
            </div>

            <div className="mt-10 grid gap-4 text-sm text-white/72 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                Projects
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                Certificates
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                Skills
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-white/72" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/35"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm text-white/72"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/35"
                  placeholder="Your password"
                  required
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
