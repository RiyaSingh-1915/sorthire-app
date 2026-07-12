"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchRing } from "@/components/ui/match-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, IndianRupee, Images as ImagesIcon } from "lucide-react";
import type { Job, CompanyInfo, SalaryDetails, OfficeInfo } from "@/types";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: userLoading } = useUser();

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [salary, setSalary] = useState<SalaryDetails | null>(null);
  const [office, setOffice] = useState<OfficeInfo | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setLoading(true);
      const jobData = (await api.getJob(id)) as Job;
      setJob(jobData);

      const [companyData, salaryData, officeData, imagesData] = await Promise.all([
        api.getCompany(jobData.company_name).catch(() => null),
        api.getSalary(id).catch(() => null),
        api.getOfficeInfo(id).catch(() => null),
        api.getCompanyImages(jobData.company_name).catch(() => ({ images: [] })),
      ]);
      setCompany(companyData as CompanyInfo);
      setSalary(salaryData as SalaryDetails);
      setOffice(officeData as OfficeInfo);
      setImages((imagesData as { images: string[] }).images || []);
      setLoading(false);
    })();
  }, [user, id]);

  if (userLoading || loading || !job) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between glass-strong rounded-xl2 p-6">
        <div>
          <h1 className="font-display font-bold text-2xl">{job.role}</h1>
          <p className="opacity-70">{job.company_name}</p>
          {job.location && (
            <p className="flex items-center gap-1.5 text-sm opacity-60 mt-1">
              <MapPin size={13} /> {job.location}
            </p>
          )}
        </div>
        <MatchRing score={job.match?.match_score ?? 0} size={90} label="match" />
      </div>

      {/* Match breakdown */}
      {job.match && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold">Match breakdown</h2>
            <Badge variant={job.match.status === "green" ? "apply" : "skip"}>
              {job.match.status === "green" ? "Apply" : "Skip"}
            </Badge>
          </div>
          <p className="text-sm opacity-80 mb-4">{job.match.recommendation}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase opacity-50 mb-2">Matched skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.match.skill_match.map((s) => (
                  <Badge key={s} variant="apply">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase opacity-50 mb-2">Missing skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.match.missing_skills.map((s) => (
                  <Badge key={s} variant="skip">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Company info */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={17} className="text-signal" />
          <h2 className="font-display font-bold">Company</h2>
          {company?.source && <Badge variant="signal">{company.source}</Badge>}
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <Field label="Type" value={company?.company_type} />
          <Field label="Industry" value={company?.industry} />
          <Field label="Founded" value={company?.founded_year?.toString()} />
          <Field label="Headquarters" value={company?.headquarters} />
          <Field label="CEO / Founder" value={company?.ceo_founder} />
          <Field label="Employees" value={company?.employee_count} />
          <Field label="Work mode" value={company?.work_mode} />
          <Field label="Working days" value={company?.working_days} />
          <Field
            label="Saturday working"
            value={
              company?.saturday_working === undefined
                ? undefined
                : company.saturday_working
                ? "Yes"
                : "No"
            }
          />
        </div>
        {company?.description && (
          <p className="text-sm opacity-70 mt-4 leading-relaxed">{company.description}</p>
        )}
      </Card>

      {/* Salary */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee size={17} className="text-signal" />
          <h2 className="font-display font-bold">Salary</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <Field label="CTC" value={salary?.ctc} />
          <Field label="Est. in-hand" value={salary?.in_hand_estimate} />
          <Field label="Bonus" value={salary?.bonus} />
          <Field label="Joining bonus" value={salary?.joining_bonus} />
          <Field label="Variable pay" value={salary?.variable_pay} />
        </div>
      </Card>

      {/* Office / commute */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={17} className="text-signal" />
          <h2 className="font-display font-bold">Office & commute</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
          <Field label="Address" value={office?.address} />
          <Field label="Nearest station" value={office?.nearest_metro} />
          <Field
            label="Distance"
            value={
              office?.distance_from_station_km
                ? `${office.distance_from_station_km.toFixed(1)} km`
                : undefined
            }
          />
        </div>
        {office?.latitude && office?.longitude && (
          <iframe
            className="w-full h-64 rounded-xl border border-current/10"
            loading="lazy"
            src={`https://www.google.com/maps?q=${office.latitude},${office.longitude}&output=embed`}
          />
        )}
      </Card>

      {/* Workplace images */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ImagesIcon size={17} className="text-signal" />
          <h2 className="font-display font-bold">Workplace photos</h2>
        </div>
        {images.length === 0 ? (
          <p className="text-sm opacity-50">
            No photos yet — connect BING_IMAGE_SEARCH_KEY in the backend to enable this.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="rounded-lg object-cover h-32 w-full" />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase opacity-50">{label}</p>
      <p>{value || <span className="opacity-40">Not available</span>}</p>
    </div>
  );
}
