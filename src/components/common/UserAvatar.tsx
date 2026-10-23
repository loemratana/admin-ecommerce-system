import { useState } from "react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  image?: string | null;
  className?: string;
};

function initialsOf(name: string) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "U";
}

/** Profile photo when there is one (and it loads), otherwise the user's initials. */
export default function UserAvatar({ name, image, className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const base = cn("flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-semibold text-blue-700", className);

  if (image && !failed) {
    return <img src={image} alt="" onError={() => setFailed(true)} className={cn(base, "object-cover")} />;
  }
  return <span className={base}>{initialsOf(name)}</span>;
}
