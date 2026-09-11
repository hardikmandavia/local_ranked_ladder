import type { Eligibility } from "../data/types";
import { MIN_WEEKS_FOR_BEST_OF } from "../data/derive";

export const ELIGIBILITY_LABEL: Record<Eligibility, string> = {
  eligible: `Eligible (${MIN_WEEKS_FOR_BEST_OF}+ weeks on this legend)`,
  pending: `Pending — can still reach ${MIN_WEEKS_FOR_BEST_OF} weeks`,
  blocked: `Blocked — cannot reach ${MIN_WEEKS_FOR_BEST_OF} weeks this season`,
};

export const ELIGIBILITY_SHORT: Record<Eligibility, string> = {
  eligible: "Eligible",
  pending: "Pending",
  blocked: "Blocked",
};

export function EligibilityIcon({ status, size = 16, className = "" }: { status: Eligibility; size?: number; className?: string }) {
  const label = ELIGIBILITY_LABEL[status];
  const common = { width: size, height: size, viewBox: "0 0 20 20", role: "img" as const, "aria-label": label, className };
  if (status === "eligible") {
    return (
      <svg {...common}>
        <title>{label}</title>
        <circle cx="10" cy="10" r="9" fill="#34c47a" />
        <path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="#062b17" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "blocked") {
    return (
      <svg {...common}>
        <title>{label}</title>
        <circle cx="10" cy="10" r="9" fill="#e5534b" />
        <path d="M5 5l10 10" stroke="#3a0b09" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="10" cy="10" r="6.5" fill="none" stroke="#3a0b09" strokeWidth="2.2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <title>{label}</title>
      <circle cx="10" cy="10" r="9" fill="#e6b450" />
      <path d="M6.5 5h7M6.5 15h7M7 5c0 3 3 4 3 5s-3 2-3 5M13 5c0 3-3 4-3 5s3 2 3 5" fill="none" stroke="#3b2a05" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
