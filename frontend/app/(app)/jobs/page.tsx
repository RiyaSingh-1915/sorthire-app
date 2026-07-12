"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { AddJobForm } from "@/components/add-job-form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/types";

export default function JobsTablePage() {
  const { user, loading: userLoading } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setJobs((await api.listJobs()) as Job[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function handleDelete(id: string) {
    await api.deleteJob(id);
    load();
  }

  if (userLoading) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">All jobs</h1>
        <AddJobForm onCreated={load} />
      </div>

      <div className="glass rounded-xl2 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left opacity-60 border-b border-current/10">
              <th className="p-4 font-medium">Company</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Match</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Location</th>
              <th className="p-4 font-medium">Apply</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="p-3">
                    <Skeleton className="h-10" />
                  </td>
                </tr>
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center opacity-60">
                  No jobs yet — add your first one above.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-b border-current/5 hover:bg-current/[0.03]">
                  <td className="p-4">
                    <Link href={`/jobs/${job.id}`} className="font-medium hover:text-signal">
                      {job.company_name}
                    </Link>
                  </td>
                  <td className="p-4">{job.role}</td>
                  <td className="p-4 font-mono">{job.match?.match_score ?? "—"}%</td>
                  <td className="p-4">
                    {job.match && (
                      <Badge variant={job.match.status === "green" ? "apply" : "skip"}>
                        {job.match.status === "green" ? "Apply" : "Skip"}
                      </Badge>
                    )}
                  </td>
                  <td className="p-4 opacity-70">{job.location || "—"}</td>
                  <td className="p-4">
                    {job.job_link && (
                      <a href={job.job_link} target="_blank" rel="noreferrer" className="text-signal">
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(job.id)} className="opacity-50 hover:opacity-100 hover:text-skip">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
