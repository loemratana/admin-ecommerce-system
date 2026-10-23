export type SummaryItem = { label: string; value: string; note?: string };

export default function Summary({ items }: { items: SummaryItem[] }) {
  return <div className="mb-5 grid grid-cols-2 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30 md:grid-cols-4">{items.map((item) => <div key={item.label} className="px-4 py-3 first:pl-4"><p className="text-xs font-medium text-slate-500">{item.label}</p><p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>{item.note && <p className="text-xs text-slate-400">{item.note}</p>}</div>)}</div>;
}
