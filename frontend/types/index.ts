export type MatchStatus = "green" | "red";

export interface MatchResult {
  job_id: string;
  resume_id: string;
  match_score: number;
  skill_match: string[];
  missing_skills: string[];
  recommendation: string;
  status: MatchStatus;
}

export interface Job {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  job_link?: string;
  job_description: string;
  location?: string;
  created_at: string;
  match?: MatchResult | null;
}

export interface ParsedResume {
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  parsed_json: ParsedResume;
  ats_score: number | null;
  ats_feedback: {
    ats_score?: number;
    missing_keywords?: string[];
    improvements?: string[];
    better_keywords?: string[];
  };
  created_at: string;
}

export interface CompanyInfo {
  name: string;
  logo_url?: string;
  description?: string;
  company_type?: string;
  employee_count?: string;
  industry?: string;
  founded_year?: number;
  headquarters?: string;
  ceo_founder?: string;
  rating?: number;
  work_culture_rating?: number;
  work_life_balance_rating?: number;
  working_days?: string;
  saturday_working?: boolean;
  work_mode?: string;
  source?: string;
}

export interface SalaryDetails {
  ctc?: string;
  in_hand_estimate?: string;
  bonus?: string;
  joining_bonus?: string;
  variable_pay?: string;
  benefits?: string[];
}

export interface OfficeInfo {
  address?: string;
  latitude?: number;
  longitude?: number;
  nearest_metro?: string;
  nearest_bus?: string;
  nearest_railway?: string;
  distance_from_station_km?: number;
  transportation_notes?: string;
}

export interface AnalyticsSummary {
  total_jobs: number;
  green_jobs: number;
  red_jobs: number;
  average_match: number;
  top_skills: [string, number][];
  missing_skills: [string, number][];
}
