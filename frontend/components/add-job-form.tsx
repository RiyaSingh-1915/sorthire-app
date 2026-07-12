"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function AddJobForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    role: "",
    job_link: "",
    job_description: "",
    location: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createJob(form);
      setForm({ company_name: "", role: "", job_link: "", job_description: "", location: "" });
      setOpen(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full md:w-auto">
        + Add job
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong rounded-xl2 p-6 flex flex-col gap-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input
          required
          placeholder="Company name"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          className="rounded-xl bg-slate-100 dark:bg-slate-900 text-black dark:text-white border border-current/20 px-4 py-2.5 text-sm outline-none focus:border-signal"
        />
        <input
          required
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="rounded-xl bg-slate-100 dark:bg-slate-900 text-black dark:text-white border border-current/20 px-4 py-2.5 text-sm outline-none focus:border-signal"
        />
        <input
          placeholder="Job link"
          value={form.job_link}
          onChange={(e) => setForm({ ...form, job_link: e.target.value })}
          className="rounded-xl bg-slate-100 dark:bg-slate-900 text-black dark:text-white border border-current/20 px-4 py-2.5 text-sm outline-none focus:border-signal"
        />
        <input
          placeholder="Location (optional)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="rounded-xl bg-slate-100 dark:bg-slate-900 text-black dark:text-white border border-current/20 px-4 py-2.5 text-sm outline-none focus:border-signal"
        />
      </div>
      <textarea
        required
        placeholder="Paste the full job description here…"
        value={form.job_description}
        onChange={(e) => setForm({ ...form, job_description: e.target.value })}
        rows={6}
        className="rounded-xl bg-slate-100 dark:bg-slate-900 text-black dark:text-white border border-current/20 px-4 py-2.5 text-sm outline-none focus:border-signal resize-none"
      />
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Matching…" : "Add & match"}
        </Button>
      </div>
    </form>
  );
}
