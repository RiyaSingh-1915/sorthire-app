"use client";

/**
 * MatchRing — the app's signature element. A radar/signal-lock style
 * circular gauge used everywhere a score appears (job cards, job detail,
 * ATS score) so "matching" has one consistent visual language.
 */
export function MatchRing({
  score,
  size = 72,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;
  const color = score >= 65 ? "#1FB574" : score >= 40 ? "#E3A008" : "#F0455C";

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold" style={{ fontSize: size * 0.24 }}>
          {Math.round(score)}%
        </span>
        {label && <span className="text-[9px] opacity-60 -mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
