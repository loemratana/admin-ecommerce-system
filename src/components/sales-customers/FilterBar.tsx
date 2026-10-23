import type { ReactNode } from "react";
import { RotateCcw, Search } from "lucide-react";

export default function FilterBar({ placeholder, children, onReset }: { placeholder: string; children?: ReactNode; onReset?: () => void }) {
  return <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/30 md:flex-row md:flex-wrap"><label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input placeholder={placeholder} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>{children}<button type="button" onClick={onReset} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" /> Reset</button></div>;
}
