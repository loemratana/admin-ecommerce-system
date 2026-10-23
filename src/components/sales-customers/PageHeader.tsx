import type { ReactNode } from "react";
import { Link } from "react-router";

export default function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <header className="mb-6 flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-end"><div><div className="mb-3 flex items-center gap-2 text-sm text-slate-500"><Link to="/" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="font-medium text-slate-700">{eyebrow}</span></div><h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>{action}</header>;
}
