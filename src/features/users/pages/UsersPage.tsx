import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Badge, Dialog, Field, Header, Input, Toast } from "@/components/shared/AdminUI";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import ImageUploadField from "@/components/common/ImageUploadField";
import UserAvatar from "@/components/common/UserAvatar";
import { useCreateUser, useUsers } from "@/features/users/hooks/useUsers";
import { userSchema, type UserFormValues } from "@/features/users/schemas/user.schema";
import { getApiErrorMessage } from "@/lib/api/errors";

const PAGE_SIZE = 10;

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

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function UserDialog({
  onClose,
  onCreate,
  error,
  saving,
}: {
  onClose: () => void;
  onCreate: (data: UserFormValues, profilePicture: string) => void;
  error: string;
  saving: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({ resolver: zodResolver(userSchema) });
  const [profilePicture, setProfilePicture] = useState("");
  const [uploading, setUploading] = useState(false);

  return (
    <Dialog title="Create User" onClose={onClose}>
      <form onSubmit={handleSubmit((data) => onCreate(data, profilePicture))} className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <ImageUploadField label="Avatar (optional)" value={profilePicture} onChange={setProfilePicture} folder="avatars" onUploadingChange={setUploading} allowSvg={false} rounded />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name">
            <Input {...register("firstName")} placeholder="John" />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
            )}
          </Field>
          <Field label="Last Name">
            <Input {...register("lastName")} placeholder="Smith" />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
            )}
          </Field>
        </div>
        <Field label="Email (optional)">
          <Input {...register("email")} placeholder="john@example.com" />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password">
            <Input type="password" {...register("password")} />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </Field>
          <Field label="Confirm Password">
            <Input type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Spinner size="sm" />}
            {saving ? "Creating..." : uploading ? "Uploading avatar..." : "Create User"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get("status");
  const active =
    statusParam === "active" ? true : statusParam === "inactive" ? false : undefined;
  const urlSearch = searchParams.get("q") ?? "";
  const sortParam = searchParams.get("sort") ?? SORT_OPTIONS[0].value;
  const [sortBy, sortDirection] = (sortParam || "createdAt,desc").split(",") as [
    string,
    "asc" | "desc"
  ];
  const page = Math.max(0, Number(searchParams.get("page") ?? 1) - 1 || 0);

  const [search, setSearch] = useState(urlSearch);
  const [dialog, setDialog] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const createMutation = useCreateUser();

  const usersQuery = useUsers({
    page,
    size: PAGE_SIZE,
    sortBy: sortBy || "createdAt",
    sortDirection: sortDirection || "desc",
    search: urlSearch.trim() || undefined,
    active,
  });

  const users = usersQuery.data?.content ?? [];
  const totalElements = usersQuery.data?.totalElements ?? 0;
  const totalPages = usersQuery.data?.totalPages ?? 0;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

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
      if (search.trim() !== urlSearch) {
        updateParams({ q: search.trim() || undefined });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, urlSearch]);

  useEffect(() => setSearch(urlSearch), [urlSearch]);

  const create = async (data: UserFormValues, profilePicture: string) => {
    setSaving(true);
    setDialogError("");
    try {
      const response = await createMutation.mutateAsync({
        email: data.email || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        confirmPassword: data.confirmPassword,
        profilePicture: profilePicture || undefined,
      });
      setDialog(false);
      notify("User created successfully.");
      navigate(`/system/users/${response.data.data.id}`);
    } catch (error) {
      setDialogError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const tabClass = (isActive: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <>
      <PageMeta
        title="Users | System"
        description="Manage administrator accounts and access to the platform."
      />
      <main className="min-h-screen pb-10">
        <Header
          crumb="System / Users"
          title="Users"
          subtitle="Manage user accounts, roles, and access to the platform."
          action={
            <button
              type="button"
              onClick={() => {
                setDialogError("");
                setDialog(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add User
            </button>
          }
        />

        {/* Filter controls */}
        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 lg:flex-row lg:items-center">
          <nav aria-label="Filter by status" className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => updateParams({ status: tab.value })}
                className={tabClass(
                  tab.value ===
                    (active === undefined ? undefined : active ? "active" : "inactive")
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search users</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <Select
            value={sortParam}
            onValueChange={(value) =>
              updateParams({ sort: value === SORT_OPTIONS[0].value ? undefined : value })
            }
            options={SORT_OPTIONS}
            placeholder="Sort"
            className="lg:w-48"
          />
        </div>

        {usersQuery.error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getApiErrorMessage(usersQuery.error)}
          </div>
        )}

        {usersQuery.isLoading ? (
          <TableSkeleton rows={8} />
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm shadow-slate-200/40">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-800">No users found</h2>
            <p className="mt-1 text-sm text-slate-500">
              {urlSearch || active !== undefined
                ? "Try adjusting your search criteria or status filter."
                : "User accounts appear here once registered."}
            </p>
          </div>
        ) : (
          <FadeIn>
            <div
              className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 transition ${
                usersQuery.isPlaceholderData ? "opacity-60" : ""
              }`}
            >
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {["User", "Roles", "Address", "Status", "Joined", ""].map((h) => (
                        <th key={h} className="px-4 py-3 first:pl-5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => {
                      const displayName =
                        user.name ||
                        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        "Unnamed User";
                      const defaultAddress =
                        user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-4 pl-5">
                            <Link
                              to={`/system/users/${user.id}`}
                              className="flex items-center gap-3"
                            >
                              <UserAvatar name={displayName} image={user.profileImage} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800 hover:text-blue-600">
                                  {displayName}
                                </p>
                                <p className="truncate text-xs text-slate-400">{user.email}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {user.role && user.role.length > 0 ? (
                                user.role.map((r) => (
                                  <Badge key={r.roleId} value={r.roleName} />
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">
                            {defaultAddress ? (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span
                                  className="truncate max-w-[180px]"
                                  title={`${defaultAddress.city}, ${defaultAddress.country}`}
                                >
                                  {[defaultAddress.city, defaultAddress.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <Badge value={user.active ? "Active" : "Inactive"} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-4 text-right pr-5">
                            <Link
                              to={`/system/users/${user.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {users.map((user) => {
                  const displayName =
                    user.name ||
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    "Unnamed User";

                  return (
                    <article key={user.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/system/users/${user.id}`}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <UserAvatar name={displayName} image={user.profileImage} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {displayName}
                            </p>
                            <p className="truncate text-xs text-slate-400">{user.email}</p>
                          </div>
                        </Link>
                        <Link
                          to={`/system/users/${user.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </Link>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex flex-wrap gap-1">
                          {user.role?.map((r) => (
                            <Badge key={r.roleId} value={r.roleName} />
                          ))}
                        </div>
                        <Badge value={user.active ? "Active" : "Inactive"} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Pagination footer */}
        {!usersQuery.isLoading && users.length > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>
              Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + users.length} of{" "}
              {totalElements.toLocaleString()} users
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() =>
                  updateParams(
                    { page: page <= 1 ? undefined : String(page) },
                    false
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="px-2 text-xs">
                Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => updateParams({ page: String(page + 2) }, false)}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {dialog && (
        <UserDialog
          onClose={() => setDialog(false)}
          onCreate={create}
          error={dialogError}
          saving={saving}
        />
      )}
      <Toast message={toast} />
    </>
  );
}
