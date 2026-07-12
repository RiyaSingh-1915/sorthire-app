import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MatchRing } from "@/components/ui/match-ring";
import { Radar } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="flex items-center gap-2 mb-8 opacity-90">
        <Radar className="text-signal" size={24} />
        <span className="font-display font-bold text-xl">SortHire</span>
      </div>

      <h1 className="font-display font-bold text-5xl md:text-6xl max-w-3xl leading-[1.05] mb-5">
        Stop reading job descriptions.
        <br />
        <span className="text-signal">Let your resume decide.</span>
      </h1>
      <p className="max-w-xl opacity-70 text-lg mb-10">
        Upload once. Paste every job you're considering. SortHire scores each
        one against your resume and sorts it green or red — with the missing
        skills to close the gap.
      </p>

      <div className="flex items-center gap-4 mb-16">
        <Link href="/login">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline">
            Sign in
          </Button>
        </Link>
      </div>

      <div className="glass-strong rounded-xl2 p-6 flex items-center gap-6 shadow-glass animate-fade-up">
        <MatchRing score={87} size={88} label="match" />
        <div className="text-left">
          <p className="font-display font-bold">Senior Frontend Engineer</p>
          <p className="text-sm opacity-60 mb-1">Stripe · Remote</p>
          <p className="text-sm opacity-80">
            Covers 11 of 13 required skills — strong match, ready to apply.
          </p>
        </div>
      </div>
    </main>
  );
}
