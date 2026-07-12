"use client";

import Link from "next/link";
import { MapPin, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchRing } from "@/components/ui/match-ring";
import type { Job } from "@/types";

export function JobCard({ job }: { job: Job }) {
  const match = job.match;
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display font-bold text-base">{job.role}</p>
          <p className="text-sm opacity-70">{job.company_name}</p>
        </div>
        <MatchRing score={match?.match_score ?? 0} size={56} />
      </div>

      {job.location && (
        <p className="flex items-center gap-1.5 text-xs opacity-60">
          <MapPin size={13} /> {job.location}
        </p>
      )}

      {match && (
        <Badge variant={match.status === "green" ? "apply" : "skip"}>
          {match.status === "green" ? "Apply" : "Skip"}
        </Badge>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-current/10">
        <Link href={`/jobs/${job.id}`} className="text-xs font-medium text-signal hover:underline">
          View details
        </Link>
        {job.job_link && (
          <a
            href={job.job_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
          >
            Apply <ExternalLink size={12} />
          </a>
        )}
      </div>
    </Card>
  );
}
