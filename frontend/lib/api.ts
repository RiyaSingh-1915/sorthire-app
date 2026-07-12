import { getAccessToken } from "./supabaseClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Resumes
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request("/resumes/upload", { method: "POST", body: form });
  },
  getActiveResume: () => request("/resumes/active"),
  updateParsedResume: (resumeId: string, parsed: unknown) =>
    request(`/resumes/${resumeId}/parsed`, { method: "PATCH", body: JSON.stringify(parsed) }),

  // Jobs
  createJob: (job: unknown) => request("/jobs", { method: "POST", body: JSON.stringify(job) }),
  listJobs: () => request("/jobs"),
  getJob: (id: string) => request(`/jobs/${id}`),
  deleteJob: (id: string) => request(`/jobs/${id}`, { method: "DELETE" }),
  runMatch: (id: string) => request(`/jobs/${id}/match`, { method: "POST" }),

  // Companies
  getCompany: (name: string) => request(`/companies/${encodeURIComponent(name)}`),
  getCompanyImages: (name: string) => request(`/companies/${encodeURIComponent(name)}/images`),
  getOfficeInfo: (jobId: string) => request(`/companies/office/${jobId}`),
  getSalary: (jobId: string) => request(`/companies/salary/${jobId}`),
  upsertSalary: (jobId: string, salary: unknown) =>
    request(`/companies/salary/${jobId}`, { method: "PUT", body: JSON.stringify(salary) }),

  // Analytics
  getAnalytics: () => request("/analytics/summary"),
};
