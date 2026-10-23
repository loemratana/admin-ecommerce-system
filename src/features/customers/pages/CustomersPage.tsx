import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, ClipboardList, Download, Eye, Search, ShoppingBag, UserCheck, UserCog, UserX, Users } from "lucide-react";
import { toast, Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import TableActionMenu from "@/components/common/TableActionMenu";
import { TableSkeleton } from "@/components/common/Skeletons";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useCustomers, useCustomerStats, useSetCustomerActive } from "@/features/customers/hooks/useCustomers";
import CustomerAvatar from "@/features/customers/components/CustomerAvatar";
import type { CustomerSummaryResponse } from "@/features/customers/types/customer.types";
import { formatMoney, formatOrderDate } from "@/features/orders/utils/order.format";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Newest first" },
  { value: "createdAt,asc", label: "Oldest first" },
  { value: "firstName,asc", label: "Name A–Z" },
  { value: "firstName,desc", label: "Name Z–A" },
  { value: "email,asc", label: "Email A–Z" },
];

const STATUS_TABS = [
  { value: undefined, label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

function exportCsv(customers: CustomerSummaryResponse[]) {
  const header = ["Name", "Email", "Phone", "Orders", "Total spent", "Last order", "Status", "Joined"];
  const rows = customers.map((c) => [c.name, c.email, c.phone ?? "", c.orderCount, c.totalSpent, c.lastOrderDate ?? "", c.active ? "Active" : "Inactive", c.joinedAt]);
  const escape = (value: unknown) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `customers-${new Date().toISOString().slice(0, 10)}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const active = statusParam === "active" ? true : statusParam === "inactive" ? false : undefined;
  const urlSearch = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? SORT_OPTIONS[0].value;
  const page = Math.max(0, Number(searchParams.get("page") ?? 1) - 1 || 0);
  const [search, setSearch] = useState(urlSearch);

  const customersQuery = useCustomers({ search: urlSearch || undefined, active, sort, page, size: PAGE_SIZE });
  const statsQuery = useCustomerStats();
  const activeMutation = useSetCustomerActive();
  const customers = customersQuery.data?.content ?? [];
  const totalElements = customersQuery.data?.totalElements ?? 0;
  const totalPages = customersQuery.data?.totalPages ?? 0;
  const stats = statsQuery.data;

  const updateParams = (changes: Record<string, string | undefined>, resetPage = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (resetPage) next.delete("page");
      return next;
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() !== urlSearch) updateParams({ q: search.trim() || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => setSearch(urlSearch), [urlSearch]);

  const toggleActive = async (customer: CustomerSummaryResponse) => {
    const next = !customer.active;
    if (!next && !window.confirm(`Deactivate ${customer.name}? They won't be able to log in until reactivated.`)) return;
    try {
      await activeMutation.mutateAsync({ id: customer.id, active: next });
      toast.success(`${customer.name} ${next ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const iconClass = "h-4 w-4 text-gray-800 dark:text-white/90";
  const summary = [
    {
      label: "Total customers",
      value: stats?.totalCustomers.toLocaleString(),
      filter: undefined,
      hint: stats ? `${stats.newThisMonth} new this month` : undefined,
      icon: <Users className={iconClass} />,
      badge: stats ? <Badge size="sm" color="success">+{stats.newThisMonth} new</Badge> : undefined,
    },
    {
      label: "Active",
      value: stats?.activeCustomers.toLocaleString(),
      filter: "active",
      hint: "Enabled accounts",
      icon: <UserCheck className="size-4 text-success-500" />,
      badge: <Badge size="sm" color="success">Active</Badge>,
    },
    {
      label: "Inactive",
      value: stats?.inactiveCustomers.toLocaleString(),
      filter: "inactive",
      hint: "Deactivated accounts",
      icon: <UserX className="size-4 text-error-500" />,
      badge: <Badge size="sm" color="error">Inactive</Badge>,
    },
    {
      label: "Have ordered",
      value: stats?.customersWithOrders.toLocaleString(),
      filter: undefined,
      hint: stats && stats.totalCustomers > 0 ? `${Math.round((stats.customersWithOrders / stats.totalCustomers) * 100)}% of customers` : undefined,
      icon: <ShoppingBag className="size-4 text-brand-500" />,
      badge: stats && stats.totalCustomers > 0 ? <Badge size="sm" color="info">{Math.round((stats.customersWithOrders / stats.totalCustomers) * 100)}%</Badge> : undefined,
    },
  ];

  const rowActions = (customer: CustomerSummaryResponse) => (
    <TableActionMenu ariaLabel={`Actions for ${customer.name}`} widthClassName="w-48">
      <button type="button" onClick={() => navigate(`/customers/${customer.id}`)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">
        <Eye className="h-3.5 w-3.5" /> View customer
      </button>
      <button type="button" onClick={() => navigate(`/sales/orders?q=${encodeURIComponent(customer.email)}`)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">
        <ClipboardList className="h-3.5 w-3.5" /> View orders
      </button>
      <button type="button" onClick={() => navigate(`/system/users/${customer.id}`)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">
        <UserCog className="h-3.5 w-3.5" /> Edit account
      </button>
      <div className="my-1 border-t border-slate-100" />
      <button
        type="button"
        disabled={activeMutation.isPending}
        onClick={() => toggleActive(customer)}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium disabled:opacity-50 ${customer.active ? "text-red-600 hover:bg-red-50" : "text-green-700 hover:bg-green-50"}`}
      >
        {customer.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
        {customer.active ? "Deactivate" : "Activate"}
      </button>
    </TableActionMenu>
  );

  const tabClass = (isActive: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <>
      <PageMeta title="Customers | E-Commerce Admin" description="Manage customer accounts." />
      <Toaster position="top-right" richColors closeButton />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="font-medium text-slate-700">Customers</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Customers</h1>
            <p className="mt-1 text-sm text-slate-500">Customer accounts, their orders and spending.</p>
          </div>
          <button type="button" disabled={customers.length === 0} onClick={() => exportCsv(customers)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <Download className="h-4 w-4" /> Export page (CSV)
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => {
              const isActive = item.filter ? statusParam === item.filter : !statusParam && item.label === "Total customers";
              return item.filter ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => updateParams({ status: item.filter })}
                  className={`group rounded-xl border p-3.5 text-left transition sm:p-4 ${
                    isActive
                      ? "border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/[0.05]"
                      : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 transition group-hover:scale-105">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
                      {item.value === undefined ? <Skeleton className="h-6 w-14" /> : item.value}
                    </h4>
                    {item.badge}
                  </div>
                  {item.hint && (
                    <p className="mt-1 truncate text-theme-xs text-gray-400 dark:text-gray-500">{item.hint}</p>
                  )}
                </button>
              ) : (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
                      {item.value === undefined ? <Skeleton className="h-6 w-14" /> : item.value}
                    </h4>
                    {item.badge}
                  </div>
                  {item.hint && (
                    <p className="mt-1 truncate text-theme-xs text-gray-400 dark:text-gray-500">{item.hint}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 lg:flex-row lg:items-center">
            <nav aria-label="Filter by status" className="flex gap-1">
              {STATUS_TABS.map((tab) => (
                <button key={tab.label} type="button" onClick={() => updateParams({ status: tab.value })} className={tabClass(tab.value === (active === undefined ? undefined : active ? "active" : "inactive"))}>
                  {tab.label}
                </button>
              ))}
            </nav>
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search customers</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email or phone…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <Select value={sort} onValueChange={(value) => updateParams({ sort: value === SORT_OPTIONS[0].value ? undefined : value })} options={SORT_OPTIONS} placeholder="Sort" className="lg:w-44" />
          </div>

          {customersQuery.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(customersQuery.error)}</div>}

          {customersQuery.isLoading ? (
            <TableSkeleton rows={8} />
          ) : customers.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm shadow-slate-200/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Users className="h-6 w-6" /></div>
              <h2 className="mt-4 text-base font-semibold text-slate-800">No customers found</h2>
              <p className="mt-1 text-sm text-slate-500">{urlSearch || active !== undefined ? "Try another search or status." : "Customers appear here when they register."}</p>
            </div>
          ) : (
            <FadeIn>
              <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 transition ${customersQuery.isPlaceholderData ? "opacity-60" : ""}`}>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[960px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        {["Customer", "Phone", "Orders", "Total spent", "Last order", "Status", "Joined", ""].map((h) => (
                          <th key={h} className="px-4 py-3 first:pl-5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-4 pl-5">
                            <Link to={`/customers/${customer.id}`} className="flex items-center gap-3">
                              <CustomerAvatar name={customer.name} image={customer.profileImage} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800 hover:text-blue-600">{customer.name}</p>
                                <p className="truncate text-xs text-slate-400">{customer.email}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-slate-500">{customer.phone ?? "—"}</td>
                          <td className="px-4 py-4 text-slate-600">{customer.orderCount}</td>
                          <td className="px-4 py-4 font-semibold text-slate-800">{formatMoney(Number(customer.totalSpent))}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{customer.lastOrderDate ? formatOrderDate(customer.lastOrderDate, false) : "Never"}</td>
                          <td className="px-4 py-4">
                            <Badge size="sm" color={customer.active ? "success" : "light"}>{customer.active ? "Active" : "Inactive"}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatOrderDate(customer.joinedAt, false)}</td>
                          <td className="px-4 py-4">{rowActions(customer)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-slate-100 lg:hidden">
                  {customers.map((customer) => (
                    <article key={customer.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <Link to={`/customers/${customer.id}`} className="flex min-w-0 items-center gap-3">
                          <CustomerAvatar name={customer.name} image={customer.profileImage} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">{customer.name}</p>
                            <p className="truncate text-xs text-slate-400">{customer.email}</p>
                          </div>
                        </Link>
                        {rowActions(customer)}
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">Orders</p>
                          <p className="mt-1 font-semibold">{customer.orderCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Spent</p>
                          <p className="mt-1 font-semibold">{formatMoney(Number(customer.totalSpent))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Status</p>
                          <div className="mt-1">
                            <Badge size="sm" color={customer.active ? "success" : "light"}>{customer.active ? "Active" : "Inactive"}</Badge>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>
              Showing {customers.length === 0 ? 0 : page * PAGE_SIZE + 1}–{page * PAGE_SIZE + customers.length} of {totalElements.toLocaleString()} customers
            </p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page === 0} onClick={() => updateParams({ page: page <= 1 ? undefined : String(page) }, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="px-2 text-xs">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
              <button type="button" disabled={page + 1 >= totalPages} onClick={() => updateParams({ page: String(page + 2) }, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
