import { useState } from "react";
import { legendHue, legendInitials, legendSlug } from "../data/legends";

// Legends whose portrait file failed to load — remembered across instances so
// a missing file is requested once, not once per cell.
const missing = new Set<string>();

interface Props {
  name: string;
  size?: number; // px
  ring?: boolean; // Instagram-story style ring
  className?: string;
}

export function LegendAvatar({ name, size = 32, ring = false, className = "" }: Props) {
  const slug = legendSlug(name);
  const [failed, setFailed] = useState(missing.has(slug));
  const src = `${import.meta.env.BASE_URL}legends/${slug}.jpg`;
  const hue = legendHue(name);

  const inner = failed ? (
    <span
      aria-hidden="true"
      className="grid place-items-center rounded-full font-display font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.36),
        background: `linear-gradient(135deg, hsl(${hue} 55% 34%), hsl(${(hue + 40) % 360} 60% 22%))`,
        color: `hsl(${hue} 80% 88%)`,
      }}
    >
      {legendInitials(name)}
    </span>
  ) : (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="rounded-full object-cover bg-surface-2"
      style={{ width: size, height: size }}
      onError={() => {
        missing.add(slug);
        setFailed(true);
      }}
    />
  );

  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={`inline-block shrink-0 rounded-full ${ring ? "ring-story" : ""} ${className}`}
    >
      <span className="block rounded-full bg-app" style={{ padding: ring ? 2 : 0 }}>
        {inner}
      </span>
    </span>
  );
}
