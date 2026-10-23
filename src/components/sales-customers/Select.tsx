import type { ReactNode } from "react";

export default function Select({ children }: { children: ReactNode }) {
  return <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500">{children}</select>;
}
