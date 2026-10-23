import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ className, ...props }: React.ComponentProps<"nav">) { return <nav aria-label="pagination" className={cn("flex w-full justify-center", className)} {...props} />; }
export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) { return <ul className={cn("flex items-center gap-1", className)} {...props} />; }
export function PaginationItem(props: React.ComponentProps<"li">) { return <li {...props} />; }
export function PaginationLink({ isActive, className, ...props }: React.ComponentProps<"button"> & { isActive?: boolean }) { return <button type="button" aria-current={isActive ? "page" : undefined} className={cn("flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition", isActive ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50", className)} {...props} />; }
export function PaginationPrevious(props: React.ComponentProps<typeof PaginationLink>) { return <PaginationLink aria-label="Previous page" {...props}><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Previous</span></PaginationLink>; }
export function PaginationNext(props: React.ComponentProps<typeof PaginationLink>) { return <PaginationLink aria-label="Next page" {...props}><span className="hidden sm:inline">Next</span><ChevronRight className="h-4 w-4" /></PaginationLink>; }
export function PaginationEllipsis() { return <span className="flex h-8 w-8 items-center justify-center text-slate-400"><MoreHorizontal className="h-4 w-4" /></span>; }
