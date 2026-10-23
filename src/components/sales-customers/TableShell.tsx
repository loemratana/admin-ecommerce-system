import type { ReactNode } from "react";

export default function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">{children}</div>;
}
