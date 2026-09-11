import slugs from "./legends.json";

// Portrait file name for a legend: explicit mapping first, else derived from the name.
export function legendSlug(name: string): string {
  const mapped = (slugs as Record<string, string>)[name];
  if (mapped) return mapped;
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function legendInitials(name: string): string {
  const parts = name.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Deterministic hue from the name so placeholders are stable across renders and pages.
export function legendHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}
