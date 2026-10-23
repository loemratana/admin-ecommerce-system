import type { ReactNode } from "react";
import { Link } from "react-router";
import { Eye, Trash2, X } from "lucide-react";
import TableActionMenu from "@/components/common/TableActionMenu";
import FadeIn from "@/components/common/FadeIn";
import { cn } from "@/lib/utils";

export const statusClass: Record<string, string> = {
  Active: "bg-green-600 text-white",
  Inactive: "bg-slate-500 text-white",
  Pending: "bg-amber-500 text-white",
  Suspended: "bg-red-600 text-white",
  System: "bg-blue-600 text-white",
  Custom: "bg-violet-600 text-white",
};

export function Badge({ value }: { value: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[value] || "bg-slate-100 text-slate-600"}`}>{value}</span>;
}

export function Header({ crumb, title, subtitle, action }: { crumb: string; title: string; subtitle: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500"><Link to="/" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="font-medium text-slate-700">{crumb}</span></div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30 ${className}`}>{children}</section>;
}

export function Actions({ items, onAction }: { items: string[]; onAction?: (item: string) => void }) {
  return (
    <TableActionMenu ariaLabel="Open actions">
      {items.map((item) => (
        <button key={item} type="button" onClick={() => onAction?.(item)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium ${item === "Delete" ? "text-red-600 hover:bg-red-50" : "text-slate-600 hover:bg-slate-50"}`}>
          {item === "Delete" ? <Trash2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {item}
        </button>
      ))}
    </TableActionMenu>
  );
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100", className)} />;
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <FadeIn key={message} className="fixed bottom-5 right-5 z-[70]">
      <div role="status" className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">{message}</div>
    </FadeIn>
  );
}

export function Summary({ items }: { items: [string, string][] }) {
  return (
    <Surface className="mb-5 grid grid-cols-2 divide-x divide-slate-200 overflow-hidden md:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="px-4 py-3">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
        </div>
      ))}
    </Surface>
  );
}
