"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/supabaseClient";
import { Radar } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = mode === "signin"
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-strong rounded-xl2 shadow-glass p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Radar className="text-signal" size={22} />
          <span className="font-display font-bold text-lg">SortHire</span>
        </div>

        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={() => signInWithGoogle()}
          type="button"
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-4 opacity-50 text-xs">
          <div className="flex-1 h-px bg-current/20" />
          OR
          <div className="flex-1 h-px bg-current/20" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl bg-slate-100 dark:bg-slate-900 text-black dark:text-white border border-current/20 px-4 py-2.5 text-sm outline-none focus:border-signal"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl bg-slate-100 dark:bg-slate-900 text-black dark:text-white border border-current/20 px-4 py-2.5 text-sm outline-none focus:border-signal"
          />
          {error && <p className="text-skip text-xs">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          className="text-xs opacity-60 hover:opacity-100 mt-5 w-full text-center"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
