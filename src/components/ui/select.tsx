import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = { value: string; onValueChange: (value: string) => void; options: { value: string; label: string }[]; placeholder: string; className?: string };
export function Select({ value, onValueChange, options, placeholder, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return <div className={cn("relative", className)}><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><span className={selected ? "text-slate-700" : "text-slate-400"}>{selected?.label || placeholder}</span><ChevronDown className="h-4 w-4 text-slate-400" /></button>{open && <><button type="button" aria-label="Close options" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} /><div role="listbox" className="absolute left-0 top-11 z-20 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">{options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onValueChange(option.value); setOpen(false); }} className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">{option.label}{option.value === value && <Check className="h-4 w-4 text-blue-600" />}</button>)}</div></>}</div>;
}
