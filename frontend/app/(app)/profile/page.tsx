"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchRing } from "@/components/ui/match-ring";
import { UploadCloud } from "lucide-react";
import type { Resume, ParsedResume } from "@/types";

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const [resume, setResume] = useState<Resume | null>(null);
  const [editing, setEditing] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const data = (await api.getActiveResume()) as Resume;
      setResume(data);
      setEditing(data.parsed_json);
    } catch {
      setResume(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadResume(file);
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function saveEdits() {
    if (!resume || !editing) return;
    await api.updateParsedResume(resume.id, editing);
    await load();
  }

  function updateList(field: keyof ParsedResume, index: number, value: string) {
    if (!editing) return;
    const next = { ...editing, [field]: [...editing[field]] };
    next[field][index] = value;
    setEditing(next);
  }

  function addItem(field: keyof ParsedResume) {
    if (!editing) return;
    setEditing({ ...editing, [field]: [...editing[field], ""] });
  }

  function removeItem(field: keyof ParsedResume, index: number) {
    if (!editing) return;
    setEditing({ ...editing, [field]: editing[field].filter((_, i) => i !== index) });
  }

  if (userLoading) return null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Your resume</h1>
        <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={handleUpload} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          <UploadCloud size={16} />
          {uploading ? "Parsing…" : resume ? "Replace resume" : "Upload resume"}
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : !resume ? (
        <Card className="text-center py-16 opacity-60">
          No resume uploaded yet. Upload a PDF or DOCX to get started.
        </Card>
      ) : (
        <>
          <Card className="flex items-center gap-6">
            <MatchRing score={resume.ats_score ?? 0} size={80} label="ATS" />
            <div>
              <p className="font-medium">{resume.file_name}</p>
              <p className="text-sm opacity-60 mb-2">
                Uploading a new resume automatically replaces this one.
              </p>
              {resume.ats_feedback?.improvements && (
                <ul className="text-sm opacity-80 list-disc pl-4 space-y-0.5">
                  {resume.ats_feedback.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {resume.ats_feedback?.better_keywords && resume.ats_feedback.better_keywords.length > 0 && (
            <Card>
              <p className="text-xs uppercase opacity-50 mb-2">Suggested keywords to add</p>
              <div className="flex flex-wrap gap-1.5">
                {resume.ats_feedback.better_keywords.map((k) => (
                  <Badge key={k} variant="signal">{k}</Badge>
                ))}
              </div>
            </Card>
          )}

          {editing &&
            (["skills", "education", "experience", "projects"] as (keyof ParsedResume)[]).map(
              (field) => (
                <Card key={field}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-bold capitalize">{field}</h2>
                    <Button size="sm" variant="ghost" onClick={() => addItem(field)}>
                      + Add
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {editing[field].length === 0 && (
                      <p className="text-sm opacity-40">Nothing extracted — add manually.</p>
                    )}
                    {editing[field].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={item}
                          onChange={(e) => updateList(field, i, e.target.value)}
                          className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-black dark:text-white border border-current/20 px-3 py-2 text-sm outline-none focus:border-signal"
                        />
                        <button
                          onClick={() => removeItem(field, i)}
                          className="text-xs opacity-50 hover:opacity-100 hover:text-skip px-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            )}

          <Button onClick={saveEdits} className="self-start">
            Save changes
          </Button>
        </>
      )}
    </div>
  );
}
