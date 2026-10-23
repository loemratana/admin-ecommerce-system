import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import {
  Actions as SharedActions,
  Badge as SharedBadge,
  Button as SharedButton,
  FilterBar as SharedFilterBar,
  PageHeader as SharedPageHeader,
  Pagination as SharedPagination,
  Select as SharedSelect,
  Summary as SharedSummary,
  TableShell as SharedTableShell,
} from "@/components/sales-customers";

export function Badge({ value }: { value: string }) {
  return <SharedBadge variant="solid" color={value === "Active" || value === "Paid" || value === "Delivered" ? "success" : value === "Pending" ? "warning" : value === "Failed" || value === "Cancelled" ? "error" : "dark"}>{value}</SharedBadge>;
}
export function Button({ children, secondary = false, onClick }: { children: ReactNode; secondary?: boolean; onClick?: () => void }) {
  return <SharedButton variant={secondary ? "outline" : "primary"} onClick={onClick}>{children}</SharedButton>;
}
export function PageHeader(props: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <SharedPageHeader {...props} />;
}
export function FilterBar({ placeholder, children, onReset }: { placeholder: string; children?: ReactNode; onReset?: () => void }) {
  return <SharedFilterBar placeholder={placeholder} onReset={onReset}>{children}</SharedFilterBar>;
}
export function Select({ children }: { children: ReactNode }) { return <SharedSelect>{children}</SharedSelect>; }
export function Summary({ items }: { items: { label: string; value: string; note?: string }[] }) { return <SharedSummary items={items} />; }
export function Actions({ items = ["View", "Edit", "Delete"] }: { items?: string[] }) { return <SharedActions items={items} />; }
export function TableShell({ children }: { children: ReactNode }) { return <SharedTableShell>{children}</SharedTableShell>; }
export function Pagination(props: ComponentProps<typeof SharedPagination>) { return <SharedPagination {...props} />; }
export function Page({ children }: { children: ReactNode }) { return <main className="font-outfit min-h-screen pb-10">{children}</main>; }
export function Avatar({ name }: { name: string }) { return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{name.split(" ").map((part) => part[0]).join("")}</span>; }
export function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) { return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold capitalize text-slate-900">{icon}<span>{title}</span></h2>{children}</section>; }
export function ProductRow({ image, name, variant, sku, qty, price }: { image: string; name: string; variant: string; sku: string; qty: string; price: string }) { return <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><img src={image} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{name}</p><p className="mt-0.5 text-xs text-slate-500">{variant} · SKU: {sku}</p></div><div className="text-right text-xs text-slate-500"><p>Qty {qty}</p><p className="mt-1 font-semibold text-slate-800">{price}</p></div></div>; }
export function Line({ label, value, tone = "text-slate-700", strong = false }: { label: string; value: string; tone?: string; strong?: boolean }) { return <div className={`flex items-center justify-between ${strong ? "border-t border-slate-200 pt-3 text-base font-semibold text-slate-900" : "text-sm"}`}><span className={strong ? "" : "text-slate-500"}>{label}</span><span className={strong ? "" : tone}>{value}</span></div>; }
export function Timeline() { return <ol className="ml-2 border-l border-slate-200 pl-6">{["Order placed", "Payment confirmed", "Processing", "Packed", "Shipped", "Delivered"].map((event, index) => <li key={event} className="relative pb-5 last:pb-0"><span className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${index < 3 ? "bg-blue-600" : "bg-slate-200"}`}>{index < 3 && <Check className="h-3 w-3 text-white" />}</span><p className="text-sm font-medium text-slate-700">{event}</p><p className="mt-0.5 text-xs text-slate-400">{index < 3 ? `Sep 3, 2026 · ${10 + index}:2${index} AM` : "Upcoming"}</p></li>)}</ol>; }
export function MiniOrder({ id, date, total, status }: { id: string; date: string; total: string; status: string }) { return <div className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold text-blue-600">{id}</p><p className="mt-1 text-xs text-slate-400">{date} · 3 items</p></div><div className="flex items-center gap-3"><span className="font-semibold text-slate-800">{total}</span><Badge value={status} /></div></div>; }
export function ReviewLine({ product, text }: { product: string; text: string }) { return <div className="border-b border-slate-100 py-3 last:border-0"><div className="flex items-center justify-between"><p className="font-medium text-slate-800">{product}</p><span className="text-amber-500">★★★★★</span></div><p className="mt-1 text-sm text-slate-500">“{text}”</p></div>; }