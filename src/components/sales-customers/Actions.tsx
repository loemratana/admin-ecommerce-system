import { Eye } from "lucide-react";
import TableActionMenu from "../common/TableActionMenu";

export default function Actions({ items = ["View", "Edit", "Delete"] }: { items?: string[] }) {
  return <TableActionMenu ariaLabel="Open row actions" widthClassName="w-48">{items.map((item) => <button type="button" key={item} onClick={() => item === "Copy Transaction ID" && navigator.clipboard?.writeText("TXN-92831")} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium ${["Delete", "Cancel Order", "Refund", "Deactivate"].includes(item) ? "text-red-600 hover:bg-red-50" : "text-slate-600 hover:bg-slate-50"}`}><Eye className="h-3.5 w-3.5" />{item}</button>)}</TableActionMenu>;
}
