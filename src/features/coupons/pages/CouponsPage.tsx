import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Search, X } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Spinner } from "@/components/ui/spinner";
import { Button, Page, PageHeader } from "@/components/shared";
import CouponDialog, { type CouponFormState } from "@/features/coupons/components/CouponDialog";
import CouponsTable from "@/features/coupons/components/CouponsTable";
import { useCoupons, useCreateCoupon, useDeleteCoupon, useToggleCouponStatus, useUpdateCoupon } from "@/features/coupons/hooks/useCoupons";
import { couponSchema } from "@/features/coupons/schemas/coupon.schema";
import type { Coupon, CouponPayload, CouponStatus } from "@/features/coupons/types/coupon.types";
import { getCouponStatus } from "@/features/coupons/utils/coupon.format";
import { getApiErrorMessage } from "@/lib/api/errors";

const emptyForm: CouponFormState = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  expiryDate: "",
  usageLimit: "",
  active: true,
};
const statuses: CouponStatus[] = ["Active", "Inactive", "Expired", "Used up"];

export default function CouponsPage() {
  const { data: coupons = [], isLoading: loading, error: loadFailure } = useCoupons();
  const loadError = loadFailure ? getApiErrorMessage(loadFailure) : "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CouponStatus | "">("");

  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState("");

  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();
  const toggleMutation = useToggleCouponStatus();

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(""), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const visible = useMemo(
    () =>
      coupons.filter(
        (coupon) =>
          coupon.code.toLowerCase().includes(search.toLowerCase()) &&
          (!statusFilter || getCouponStatus(coupon) === statusFilter),
      ),
    [coupons, search, statusFilter],
  );

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setForm(emptyForm);
    setDialog("create");
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setFormError("");
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount == null ? "" : String(coupon.minOrderAmount),
      expiryDate: coupon.expiryDate.slice(0, 10),
      usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit),
      active: coupon.active,
    });
    setDialog("edit");
  };

  const handleFormChange = <K extends keyof CouponFormState>(field: K, value: CouponFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    const parsed = couponSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    const values = parsed.data;
    const payload: CouponPayload = {
      code: values.code,
      discountType: values.discountType,
      discountValue: Number(values.discountValue),
      minOrderAmount: values.minOrderAmount === "" ? null : Number(values.minOrderAmount),
      // Backend stores LocalDateTime; keep the coupon valid through the whole selected day
      expiryDate: `${values.expiryDate}T23:59:59`,
      usageLimit: values.usageLimit === "" ? null : Number(values.usageLimit),
      active: values.active,
    };
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        setBanner("Coupon updated.");
      } else {
        await createMutation.mutateAsync(payload);
        setBanner("Coupon created.");
      }
      setDialog(null);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      await toggleMutation.mutateAsync(coupon);
      setBanner(`Coupon ${coupon.code} ${coupon.active ? "disabled" : "enabled"}.`);
    } catch (error) {
      setBanner(getApiErrorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setBanner("Coupon deleted.");
      setDeleteTarget(null);
    } catch (error) {
      setBanner(getApiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Page>
      <PageMeta title="Coupons | E-Commerce Admin" description="Create and manage promotional discount codes." />
      <PageHeader
        eyebrow="Sales / Coupons"
        title="Coupons"
        subtitle="Create and manage promotional discount codes."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
        }
      />

      {banner && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{banner}</div>}
      {loadError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>}

      <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/30 md:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coupon code..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CouponStatus | "")} aria-label="Filter by status" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500">
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-50">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No coupons found.</div>
      ) : (
        <FadeIn>
          <CouponsTable pageResetKey={`${search}|${statusFilter}`} coupons={visible} onEdit={openEdit} onToggleStatus={toggleStatus} onDelete={setDeleteTarget} />
        </FadeIn>
      )}

      {dialog && (
        <CouponDialog mode={dialog} form={form} saving={saving} error={formError} onChange={handleFormChange} onClose={() => setDialog(null)} onSubmit={save} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="flex justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Delete Coupon?</h2>
              <button onClick={() => setDeleteTarget(null)} aria-label="Close"><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">This will permanently remove "{deleteTarget.code}". Customers will no longer be able to use it.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button disabled={deleting} onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {deleting && <Spinner size="sm" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
