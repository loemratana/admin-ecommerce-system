import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, MessageSquare, Pencil, Search, Star, ThumbsUp, Trash2, X } from "lucide-react";
import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import TableActionMenu from "@/components/common/TableActionMenu";
import { useDeleteReview, useReviews, useUpdateReview } from "@/features/reviews/hooks/useReviews";
import ReviewDialog, { type ReviewFormState } from "@/features/reviews/components/ReviewDialog";
import { reviewSchema } from "@/features/reviews/schemas/review.schema";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ProductReview } from "@/features/reviews/types/review.types";
import { formatMoney } from "@/lib/currency";

const emptyForm: ReviewFormState = { title: "", ratings: 5, comment: "" };
const PAGE_SIZE = 10;

function Avatar({ name, image }: { name: string; image?: string }) {
  if (image) {
    return <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-3.5 w-3.5 ${star <= rating ? "fill-current" : "text-slate-200"}`} />
      ))}
    </span>
  );
}

function ReviewActions({
  review,
  onEdit,
  onDelete,
}: {
  review: ProductReview;
  onEdit: (review: ProductReview) => void;
  onDelete: (review: ProductReview) => void;
}) {
  return (
    <TableActionMenu ariaLabel={`Actions for ${review.user.firstName} ${review.user.lastName}`} widthClassName="w-40">
      <>
        <button
          type="button"
          onClick={() => onEdit(review)}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(review)}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </>
    </TableActionMenu>
  );
}

export default function ReviewsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("all");
  const [product, setProduct] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [detail, setDetail] = useState<ProductReview | null>(null);
  const [editing, setEditing] = useState<ProductReview | null>(null);
  const [form, setForm] = useState<ReviewFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProductReview | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState("");

  const {
    data: reviewPage,
    isLoading: loadingReviews,
    error: loadFailure,
  } = useReviews({ page, size: PAGE_SIZE });
  const reviews = useMemo(() => reviewPage?.content ?? [], [reviewPage]);
  const loadError = loadFailure ? getApiErrorMessage(loadFailure) : "";

  const applyFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  const updateMutation = useUpdateReview();
  const deleteMutation = useDeleteReview();

  const notify = (message: string) => {
    setBanner(message);
    window.setTimeout(() => setBanner(""), 3000);
  };

  const productOptions = useMemo(
    () => Array.from(new Set(reviews.map((review) => review.product.name))).sort(),
    [reviews],
  );

  const filtered = useMemo(
    () =>
      reviews.filter(
        (review) =>
          (!search ||
            `${review.user.firstName} ${review.user.lastName} ${review.product.name} ${review.title} ${review.comment}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (rating === "all" || review.ratings === Number(rating)) &&
          (product === "all" || review.product.name === product),
      ),
    [reviews, search, rating, product],
  );

  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.ratings, 0) / reviews.length).toFixed(1)
    : "0.0";

  const fiveStarCount = useMemo(
    () => reviews.filter((review) => review.ratings === 5).length,
    [reviews],
  );
  const oneStarCount = useMemo(
    () => reviews.filter((review) => review.ratings === 1).length,
    [reviews],
  );

  const iconClass = "h-4 w-4 text-gray-800 dark:text-white/90";
  const summary = [
    {
      label: "Total reviews",
      value: loadingReviews ? undefined : (reviewPage?.totalElements ?? reviews.length).toLocaleString(),
      filter: "all",
      hint: "Across all products",
      icon: <MessageSquare className={iconClass} />,
      badge: <Badge size="sm" color="info">All</Badge>,
    },
    {
      label: "Average rating",
      value: loadingReviews ? undefined : `${averageRating} / 5`,
      filter: undefined,
      hint: reviews.length ? `Based on ${reviews.length} reviews on page` : "No ratings yet",
      icon: <Star className="h-4 w-4 text-amber-500 fill-amber-500" />,
      badge: (
        <Badge
          size="sm"
          color={Number(averageRating) >= 4 ? "success" : Number(averageRating) >= 3 ? "warning" : "error"}
        >
          {Number(averageRating) >= 4 ? "Positive" : Number(averageRating) >= 3 ? "Average" : "Needs attention"}
        </Badge>
      ),
    },
    {
      label: "5-star ratings",
      value: loadingReviews ? undefined : fiveStarCount.toLocaleString(),
      filter: "5",
      hint: reviews.length > 0 ? `${Math.round((fiveStarCount / reviews.length) * 100)}% on this page` : undefined,
      icon: <ThumbsUp className="h-4 w-4 text-success-500" />,
      badge: <Badge size="sm" color="success">5 Stars</Badge>,
    },
    {
      label: "1-star ratings",
      value: loadingReviews ? undefined : oneStarCount.toLocaleString(),
      filter: "1",
      hint: oneStarCount === 0 ? "No 1-star reviews" : `${oneStarCount} critical review${oneStarCount > 1 ? "s" : ""}`,
      icon: <AlertCircle className="h-4 w-4 text-error-500" />,
      badge: (
        <Badge size="sm" color={oneStarCount > 0 ? "error" : "success"}>
          {oneStarCount > 0 ? "Attention" : "Clean"}
        </Badge>
      ),
    },
  ];

  const totalPages = reviewPage?.totalPages ?? 0;
  const currentPage = reviewPage?.currentPage ?? page;

  const openEdit = (review: ProductReview) => {
    setEditing(review);
    setFormError("");
    setForm({ title: review.title, ratings: review.ratings, comment: review.comment });
  };

  const handleFormChange = (field: keyof ReviewFormState, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    if (!editing) return;
    const parsed = reviewSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await updateMutation.mutateAsync({ id: editing.id, payload: parsed.data });
      notify("Review updated.");
      setEditing(null);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      notify("Review deleted.");
      setDeleteTarget(null);
      setDetail(null);
    } catch (error) {
      notify(getApiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<ProductReview>[] = [
    {
      id: "user",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.original.user.firstName} ${row.original.user.lastName}`} image={row.original.user.profileImage} />
          <p className="font-semibold text-slate-800">
            {row.original.user.firstName} {row.original.user.lastName}
          </p>
        </div>
      ),
    },
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex min-w-[155px] items-center gap-2">
          {row.original.product.imageUrl && (
            <img src={row.original.product.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
          )}
          <p className="font-medium text-slate-700">{row.original.product.name}</p>
        </div>
      ),
    },
    {
      accessorKey: "ratings",
      header: "Rating",
      cell: ({ row }) => <Stars rating={row.original.ratings} />,
    },
    {
      id: "comment",
      header: "Review",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setDetail(row.original)}
          className="max-w-[270px] text-left text-sm text-slate-600 hover:text-blue-600"
        >
          <p className="font-medium text-slate-700">{row.original.title}</p>
          <span className="line-clamp-2">{row.original.comment}</span>
        </button>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <ReviewActions review={row.original} onEdit={openEdit} onDelete={setDeleteTarget} />,
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <PageMeta title="Reviews | E-Commerce Admin" description="Manage customer reviews and ratings." />
      <main className="min-h-screen pb-10">
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="font-medium text-slate-700">Customers / Reviews</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Reviews</h1>
          <p className="mt-1 text-sm text-slate-500">Manage customer reviews and ratings across all products.</p>
        </header>

        {banner && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{banner}</div>}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => {
            const isActive = item.filter ? rating === item.filter : false;
            return item.filter ? (
              <button
                key={item.label}
                type="button"
                onClick={() => applyFilter(setRating)(item.filter === rating && item.filter !== "all" ? "all" : item.filter)}
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

        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 xl:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => applyFilter(setSearch)(event.target.value)}
                placeholder="Search customer, product, or review..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <Select
              value={rating}
              onValueChange={applyFilter(setRating)}
              options={["all", "5", "4", "3", "2", "1"].map((value) => ({ value, label: value === "all" ? "All Ratings" : value }))}
              placeholder="Rating"
              className="xl:w-40"
            />
            <Select
              value={product}
              onValueChange={applyFilter(setProduct)}
              options={["all", ...productOptions].map((value) => ({ value, label: value === "all" ? "All Products" : value }))}
              placeholder="Product"
              className="xl:w-56"
            />
          </div>
        </section>

        {loadError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>}

        {loadingReviews ? (
          <TableSkeleton />
        ) : (
          <FadeIn>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {filtered.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
                  <h2 className="mt-3 text-base font-semibold text-slate-800">No reviews found</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {reviews.length === 0 ? "Customer reviews will appear here." : "No reviews match your filters."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1020px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        {table.getHeaderGroups()[0].headers.map((header) => (
                          <th key={header.id} className="px-4 py-3 first:pl-5">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-4 first:pl-5">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </FadeIn>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-slate-500">
              Page {currentPage + 1} of {totalPages} · {reviewPage?.totalElements ?? 0} reviews
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={!reviewPage?.hasPrevious}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive>{currentPage + 1}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    disabled={!reviewPage?.hasNext}
                    onClick={() => setPage((current) => current + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20" onClick={() => setDetail(null)}>
          <aside className="review-detail h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Review</h2>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8">
              <Stars rating={detail.ratings} />
              <p className="mt-4 text-lg font-semibold text-slate-900">{detail.title}</p>
              <blockquote className="mt-2 text-base leading-7 text-slate-700">"{detail.comment}"</blockquote>
              <div className="mt-6 flex items-center gap-3">
                <Avatar name={`${detail.user.firstName} ${detail.user.lastName}`} image={detail.user.profileImage} />
                <div>
                  <p className="font-semibold text-slate-800">
                    {detail.user.firstName} {detail.user.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{new Date(detail.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-8 border-t border-slate-100 pt-5">
                <p className="font-semibold text-slate-800">{detail.product.name}</p>
                <p className="mt-1 text-sm text-slate-500">{formatMoney(detail.product.price)}</p>
              </div>
              <div className="mt-8 flex gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    openEdit(detail);
                    setDetail(null);
                  }}
                  className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(detail);
                    setDetail(null);
                  }}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {editing && (
        <ReviewDialog form={form} saving={saving} error={formError} onChange={handleFormChange} onClose={() => setEditing(null)} onSubmit={save} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
          <div className="review-confirm w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete review?</h2>
            <p className="mt-2 text-sm text-slate-500">
              This will permanently remove {deleteTarget.user.firstName} {deleteTarget.user.lastName}'s review.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && <Spinner size="sm" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
