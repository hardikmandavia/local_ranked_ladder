import type { Eligibility } from "../data/types";
import { LegendAvatar } from "./LegendAvatar";
import { EligibilityIcon, ELIGIBILITY_SHORT } from "./EligibilityIcon";
import { Link } from "react-router-dom";

// Small legend portrait with the eligibility icon tucked into its bottom-right
// corner; marks a player as the current best-of on that legend.
export function BestOfBadge({ legend, status, size = 22 }: { legend: string; status: Eligibility; size?: number }) {
  const label = `Best of ${legend} · ${ELIGIBILITY_SHORT[status]}`;
  const icon = Math.round(size * 0.5);
  return (
    <Link
      to={`/best-of?legend=${encodeURIComponent(legend)}`}
      className="relative inline-block shrink-0 rounded-full align-middle"
      style={{ width: size, height: size }}
      title={label}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
    >
      <LegendAvatar name={legend} size={size} />
      <span
        aria-hidden="true"
        className="absolute rounded-full bg-elev"
        style={{ right: -icon * 0.25, bottom: -icon * 0.25, padding: 1, lineHeight: 0 }}
      >
        <EligibilityIcon status={status} size={icon} />
      </span>
    </Link>
  );
}
