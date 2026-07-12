"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsSummary } from "@/types";

const COLORS = { green: "#1FB574", red: "#F0455C" };

export default function AnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setData((await api.getAnalytics()) as AnalyticsSummary);
      setLoading(false);
    })();
  }, [user]);

  if (userLoading || loading || !data) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    );
  }

  const pieData = [
    { name: "Apply", value: data.green_jobs, color: COLORS.green },
    { name: "Skip", value: data.red_jobs, color: COLORS.red },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl">Analytics</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="Total jobs" value={data.total_jobs} />
        <StatCard label="Green jobs" value={data.green_jobs} accent="apply" />
        <StatCard label="Red jobs" value={data.red_jobs} accent="skip" />
        <StatCard label="Average match" value={`${data.average_match}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-display font-bold mb-3">Apply vs. skip</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="font-display font-bold mb-3">Top skills you already have</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.top_skills.map(([name, count]) => ({ name, count }))}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6C5CE7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="md:col-span-2">
          <h2 className="font-display font-bold mb-3">Most common missing skills</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.missing_skills.map(([name, count]) => ({ name, count }))}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#F0455C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "apply" | "skip";
}) {
  return (
    <Card>
      <p className="text-xs uppercase opacity-50 mb-1">{label}</p>
      <p
        className={`font-display font-bold text-3xl ${
          accent === "apply" ? "text-apply" : accent === "skip" ? "text-skip" : ""
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
