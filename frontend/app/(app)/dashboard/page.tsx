"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { AddJobForm } from "@/components/add-job-form";
import { JobCard } from "@/components/job-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Job } from "@/types";

type Filter = "all" | "green" | "red";
type Sort = "match" | "recent";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("match");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = (await api.listJobs()) as Job[];
      setJobs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  const filtered = useMemo(() => {
    let result = jobs;
    if (filter !== "all") result = result.filter((j) => j.match?.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.company_name.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q) ||
          (j.location || "").toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) =>
      sort === "match"
        ? (b.match?.match_score ?? 0) - (a.match?.match_score ?? 0)
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [jobs, filter, sort, search]);

  if (userLoading) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl">Your jobs</h1>
          <p className="opacity-60 text-sm">{jobs.length} tracked · sorted by match</p>
        </div>
        <AddJobForm onCreated={load} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Search company, role, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl bg-current/5 border border-current/10 px-4 py-2 text-sm outline-none focus:border-signal w-64"
        />
        {(["all", "green", "red"] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "primary" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "green" ? "🟢 Apply" : "🔴 Skip"}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={sort === "match" ? "primary" : "outline"} onClick={() => setSort("match")}>
            Highest match
          </Button>
          <Button size="sm" variant={sort === "recent" ? "primary" : "outline"} onClick={() => setSort("recent")}>
            Most recent
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl2 p-12 text-center opacity-60">
          No jobs yet — add your first one above.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
