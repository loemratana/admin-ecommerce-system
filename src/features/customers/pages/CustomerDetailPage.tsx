import { useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, ClipboardList, MapPin, Star, UserCheck, UserCog, UserRound, UserX } from "lucide-react";
import { toast, Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { DetailSkeleton } from "@/components/common/Skeletons";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { PageResponse } from "@/lib/api/types";
import { useCustomer, useCustomerOrders, useCustomerReviews, useSetCustomerActive, useSetCustomerAvatar } from "@/features/customers/hooks/useCustomers";
import CustomerAvatar from "@/features/customers/components/CustomerAvatar";
import type { CustomerDetailResponse } from "@/features/customers/types/customer.types";
import type { OrderStatus, OrderSummaryResponse } from "@/features/orders/types/order.types";
import { ORDER_FLOW, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, formatMoney, formatOrderDate } from "@/features/orders/utils/order.format";

type Tab = "overview" | "orders" | "reviews" | "addresses";

// No SVG for avatars (they can carry scripts); 10MB is the backend multipart limit.
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

function Section({ title, icon, action, children }: { title: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {icon}
          <span>{title}</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Pager({ page, data, onChange }: { page: number; data?: PageResponse<unknown>; onChange: (page: number) => void }) {
  if (!data || data.totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-1 text-xs text-slate-500">
      <button type="button" disabled={!data.hasPrevious} onClick={() => onChange(page - 1)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 font-medium hover:bg-slate-50 disabled:opacity-50">
        <ChevronLeft className="h-3.5 w-3.5" /> Previous
      </button>
      <span className="px-2">Page {page + 1} of {data.totalPages}</span>
      <button type="button" disabled={!data.hasNext} onClick={() => onChange(page + 1)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 font-medium hover:bg-slate-50 disabled:opacity-50">
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function OrderRows({ orders }: { orders: OrderSummaryResponse[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {orders.map((order) => (
        <Link key={order.orderNumber} to={`/sales/orders/${order.orderNumber}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
          <div className="min-w-0">
            <p className="font-semibold text-blue-600">#{order.orderNumber}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatOrderDate(order.orderDate)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-semibold text-slate-800">{formatMoney(Number(order.totalOrderPrice))}</span>
            <Badge size="sm" color={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatusBreakdown({ customer }: { customer: CustomerDetailResponse }) {
  const statuses: OrderStatus[] = [...ORDER_FLOW, "CANCELLED"];
  const max = Math.max(1, ...statuses.map((s) => customer.ordersByStatus[s] ?? 0));
  return (
    <div className="space-y-2.5">
      {statuses.map((status) => {
        const count = customer.ordersByStatus[status] ?? 0;
        return (
          <div key={status} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-slate-600">{ORDER_STATUS_LABEL[status]}</span>
            <div className="h-2 flex-1 rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${status === "CANCELLED" ? "bg-red-400" : "bg-blue-500"}`} style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right font-medium text-slate-800">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const [tab, setTab] = useState<Tab>("overview");
  const [ordersPage, setOrdersPage] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(0);

  const { data: customer, isLoading, error } = useCustomer(customerId);
  const ordersQuery = useCustomerOrders(customerId, tab === "orders" ? ordersPage : 0, tab === "orders" ? 10 : 5);
  const reviewsQuery = useCustomerReviews(customerId, reviewsPage, tab === "reviews");
  const activeMutation = useSetCustomerActive();
  const avatarMutation = useSetCustomerAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const changeAvatar = async (file: File | undefined) => {
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (!customer || !file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error("Please choose a PNG, JPG, WEBP or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 10MB or smaller.");
      return;
    }
    try {
      await avatarMutation.mutateAsync({ id: customer.id, file });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const removeAvatar = async () => {
    if (!customer || !window.confirm(`Remove ${customer.name}'s profile photo?`)) return;
    try {
      await avatarMutation.mutateAsync({ id: customer.id, file: null });
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const toggleActive = async () => {
    if (!customer) return;
    const next = !customer.active;
    if (!next && !window.confirm(`Deactivate ${customer.name}? They won't be able to log in until reactivated.`)) return;
    try {
      await activeMutation.mutateAsync({ id: customer.id, active: next });
      toast.success(`${customer.name} ${next ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "overview", label: "Overview" },
    { value: "orders", label: "Orders", count: customer?.orderCount },
    { value: "reviews", label: "Reviews", count: customer?.reviewCount },
    { value: "addresses", label: "Addresses", count: customer?.addresses.length },
  ];

  const orders = ordersQuery.data?.content ?? [];

  return (
    <>
      <PageMeta title={`${customer?.name ?? "Customer"} | E-Commerce Admin`} description="Customer profile." />
      <Toaster position="top-right" richColors closeButton />
      <main className="font-outfit min-h-screen pb-10">
        <Link to="/customers" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(error)}</div>}

        {isLoading ? (
          <DetailSkeleton rows={6} />
        ) : customer ? (
          <FadeIn className="space-y-5">
            {/* Profile header */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30 md:flex-row md:items-center">
              <div className="flex shrink-0 flex-col items-center gap-1">
                <input ref={avatarInputRef} type="file" accept={AVATAR_TYPES.join(",")} hidden onChange={(event) => changeAvatar(event.target.files?.[0])} />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarMutation.isPending}
                  title="Change profile photo"
                  aria-label="Change profile photo"
                  className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait"
                >
                  {/* key: retry loading when the image URL changes after a broken one */}
                  <CustomerAvatar key={customer.profileImage ?? "none"} name={customer.name} image={customer.profileImage} size="lg" />
                  <span className={`absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50 text-white transition ${avatarMutation.isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
                    {avatarMutation.isPending ? <Spinner size="md" /> : <Camera className="h-5 w-5" />}
                  </span>
                </button>
                {customer.profileImage && !avatarMutation.isPending && (
                  <button type="button" onClick={removeAvatar} className="text-xs font-medium text-slate-400 hover:text-red-600">
                    Remove
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{customer.name}</h1>
                  <Badge size="sm" color={customer.active ? "success" : "light"}>{customer.active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <a href={`mailto:${customer.email}`} className="text-blue-600">{customer.email}</a>
                  {customer.phone && <a href={`tel:${customer.phone}`}>{customer.phone}</a>}
                  <span>Customer since {formatOrderDate(customer.joinedAt, false)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/system/users/${customer.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <UserCog className="h-4 w-4" /> Edit account
                </Link>
                <button
                  type="button"
                  disabled={activeMutation.isPending}
                  onClick={toggleActive}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold disabled:opacity-60 ${customer.active ? "border border-red-200 bg-white text-red-600 hover:bg-red-50" : "bg-green-600 text-white hover:bg-green-700"}`}
                >
                  {activeMutation.isPending ? <Spinner size="sm" /> : customer.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  {customer.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>

            {/* Key figures */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Orders", value: customer.orderCount.toLocaleString(), note: customer.lastOrderDate ? `Last ${formatOrderDate(customer.lastOrderDate, false)}` : "No orders yet" },
                { label: "Total spent", value: formatMoney(Number(customer.totalSpent)), note: "Paid orders only" },
                { label: "Average order", value: formatMoney(Number(customer.averageOrderValue)) },
                { label: "Reviews", value: customer.reviewCount.toLocaleString() },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
                  {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
              {tabs.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTab(item.value)}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === item.value ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  {item.label}
                  {item.count !== undefined && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{item.count}</span>}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <Section
                  title="Recent orders"
                  icon={<ClipboardList className="h-4 w-4" />}
                  action={customer.orderCount > 5 && <button type="button" onClick={() => setTab("orders")} className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</button>}
                >
                  {ordersQuery.isLoading ? (
                    Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="my-2 h-10 w-full" />)
                  ) : orders.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No orders yet.</p>
                  ) : (
                    <OrderRows orders={orders.slice(0, 5)} />
                  )}
                </Section>
                <div className="space-y-5">
                  <Section title="Orders by status" icon={<ClipboardList className="h-4 w-4" />}>
                    <StatusBreakdown customer={customer} />
                  </Section>
                  <Section title="Account" icon={<UserRound className="h-4 w-4" />}>
                    <dl className="space-y-2 text-sm">
                      {[
                        ["First name", customer.firstName],
                        ["Last name", customer.lastName],
                        ["Joined", formatOrderDate(customer.joinedAt)],
                        ["Last updated", formatOrderDate(customer.updatedAt)],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <dt className="text-slate-500">{label}</dt>
                          <dd className="text-right font-medium text-slate-700">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </Section>
                </div>
              </div>
            )}

            {tab === "orders" && (
              <Section
                title="All orders"
                icon={<ClipboardList className="h-4 w-4" />}
                action={<Link to={`/sales/orders?q=${encodeURIComponent(customer.email)}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">Open in Orders</Link>}
              >
                {ordersQuery.isLoading ? (
                  Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="my-2 h-10 w-full" />)
                ) : orders.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No orders yet.</p>
                ) : (
                  <div className={ordersQuery.isPlaceholderData ? "opacity-60" : ""}>
                    <OrderRows orders={orders} />
                  </div>
                )}
                <Pager page={ordersPage} data={ordersQuery.data} onChange={setOrdersPage} />
              </Section>
            )}

            {tab === "reviews" && (
              <Section title="Product reviews" icon={<Star className="h-4 w-4" />}>
                {reviewsQuery.isLoading ? (
                  Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="my-2 h-14 w-full" />)
                ) : reviewsQuery.error ? (
                  <p className="text-sm text-red-600">{getApiErrorMessage(reviewsQuery.error)}</p>
                ) : (reviewsQuery.data?.content.length ?? 0) === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No reviews yet.</p>
                ) : (
                  <div className={`divide-y divide-slate-100 ${reviewsQuery.isPlaceholderData ? "opacity-60" : ""}`}>
                    {reviewsQuery.data?.content.map((review) => (
                      <article key={review.id} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">{review.product?.name ?? "Product"}</p>
                            {review.title && <p className="text-sm text-slate-700">{review.title}</p>}
                          </div>
                          <span className="shrink-0 text-amber-500" aria-label={`${review.ratings} out of 5`}>
                            {"★".repeat(Math.round(Number(review.ratings)))}
                            <span className="text-slate-200">{"★".repeat(5 - Math.round(Number(review.ratings)))}</span>
                          </span>
                        </div>
                        {review.comment && <p className="mt-1 text-sm text-slate-500">“{review.comment}”</p>}
                        <p className="mt-1 text-xs text-slate-400">{formatOrderDate(review.createdAt, false)}</p>
                      </article>
                    ))}
                  </div>
                )}
                <Pager page={reviewsPage} data={reviewsQuery.data} onChange={setReviewsPage} />
              </Section>
            )}

            {tab === "addresses" &&
              (customer.addresses.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-white px-3 py-10 text-center text-sm text-slate-500">No saved addresses.</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {customer.addresses.map((address) => (
                    <Section
                      key={address.id}
                      title={address.isDefault ? "Default address" : "Address"}
                      icon={<MapPin className="h-4 w-4" />}
                      action={address.isDefault && <Badge size="sm" color="primary">Default</Badge>}
                    >
                      <address className="text-sm not-italic leading-6 text-slate-600">
                        {address.street}
                        <br />
                        {[address.city, address.state, address.zipCode].filter(Boolean).join(", ")}
                        {address.country && (
                          <>
                            <br />
                            {address.country}
                          </>
                        )}
                      </address>
                    </Section>
                  ))}
                </div>
              ))}
          </FadeIn>
        ) : null}
      </main>
    </>
  );
}
