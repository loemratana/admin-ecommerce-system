import { useState } from "react";

const sizes = { sm: "h-9 w-9 text-xs", lg: "h-14 w-14 text-base" } as const;

export default function CustomerAvatar({ name, image, size = "sm" }: { name: string; image?: string | null; size?: keyof typeof sizes }) {
  const [broken, setBroken] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (image && !broken) {
    return <img src={image} alt="" onError={() => setBroken(true)} className={`${sizes[size]} shrink-0 rounded-full object-cover ring-1 ring-slate-200`} />;
  }
  return <span className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700`}>{initials || "?"}</span>;
}
