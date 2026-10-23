import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import ImageUploadField from "@/components/common/ImageUploadField";
import UserAvatar from "@/components/common/UserAvatar";
import { Actions, Badge, Dialog, Field, Header, Input, Surface, Toast } from "@/components/shared/AdminUI";
import { useDeleteUser, useUpdateUser, useUpdateUserPassword, useUser } from "@/features/users/hooks/useUsers";
import { getApiErrorMessage } from "@/lib/api/errors";

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);

  const userQuery = useUser(userId);
  const user = userQuery.data ?? null;
  const loading = userQuery.isLoading;
  const error = userQuery.error ? getApiErrorMessage(userQuery.error) : "";
  const updateMutation = useUpdateUser();
  const passwordMutation = useUpdateUserPassword();
  const deleteMutation = useDeleteUser();
  const [toast, setToast] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", profilePicture: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editError, setEditError] = useState("");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const openEdit = () => {
    if (!user) return;
    setEditForm({ firstName: user.firstName, lastName: user.lastName, profilePicture: user.profileImage ?? "" });
    setEditError("");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    setEditError("");
    try {
      await updateMutation.mutateAsync({ id: userId, payload: { firstName: editForm.firstName, lastName: editForm.lastName, profilePicture: editForm.profilePicture } });
      setEditOpen(false);
      notify("User updated.");
    } catch (err) {
      setEditError(getApiErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const savePassword = async () => {
    setSavingPassword(true);
    setPasswordError("");
    try {
      await passwordMutation.mutateAsync({ id: userId, payload: passwordForm });
      setPasswordOpen(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
      notify("Password changed.");
    } catch (err) {
      setPasswordError(getApiErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const remove = async () => {
    if (!user || !window.confirm(`Permanently delete "${user.name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(userId);
      notify("User deleted.");
      navigate("/system/users");
    } catch (err) {
      notify(getApiErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pb-10 p-6">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
        </div>
        <DetailSkeleton withImage={false} rows={5} />
      </main>
    );
  }
  if (error || !user) return <main className="min-h-screen pb-10 p-6 text-sm text-red-600">{error || "User not found."}</main>;

  return (
    <>
      <PageMeta title={`${user.name} | System`} description="Review user account details." />
      <main className="min-h-screen pb-10">
        <Header
          crumb={`System / Users / ${user.name}`}
          title={user.name}
          subtitle={user.email}
          action={
            <div className="flex gap-2">
              <button type="button" onClick={openEdit} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600">Edit</button>
              <Actions items={["Reset Password", "Delete"]} onAction={(action) => (action === "Reset Password" ? setPasswordOpen(true) : remove())} />
            </div>
          }
        />
        <Surface className="mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <UserAvatar name={user.name} image={user.profileImage} className="h-14 w-14 text-sm" />
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">{user.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{user.email} {user.phone ? `· ${user.phone}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role.map((role) => <Badge key={role.roleId} value={role.roleName} />)}
            <Badge value={user.active ? "Active" : "Inactive"} />
          </div>
        </Surface>
        <Surface className="p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Account information</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><p className="text-xs text-slate-400">First Name</p><p className="mt-1 text-sm font-medium text-slate-700">{user.firstName}</p></div>
            <div><p className="text-xs text-slate-400">Last Name</p><p className="mt-1 text-sm font-medium text-slate-700">{user.lastName}</p></div>
            <div><p className="text-xs text-slate-400">Created</p><p className="mt-1 text-sm font-medium text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</p></div>
            <div><p className="text-xs text-slate-400">Updated</p><p className="mt-1 text-sm font-medium text-slate-700">{new Date(user.updatedAt).toLocaleDateString()}</p></div>
          </div>
          {user.addresses.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-800">Addresses</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {user.addresses.map((address) => (
                  <div key={address.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                    <p>{address.country} {address.isDefault && <span className="ml-1 text-xs font-semibold text-blue-600">(default)</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Surface>
      </main>

      {editOpen && (
        <Dialog title="Edit User" onClose={() => setEditOpen(false)}>
          <div className="space-y-4">
            {editError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}
            <ImageUploadField label="Avatar" value={editForm.profilePicture} onChange={(url) => setEditForm((current) => ({ ...current, profilePicture: url }))} folder="avatars" onUploadingChange={setUploadingAvatar} allowSvg={false} rounded />
            <Field label="First Name"><Input value={editForm.firstName} onChange={(event) => setEditForm((current) => ({ ...current, firstName: event.target.value }))} /></Field>
            <Field label="Last Name"><Input value={editForm.lastName} onChange={(event) => setEditForm((current) => ({ ...current, lastName: event.target.value }))} /></Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setEditOpen(false)} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600">Cancel</button>
              <button type="button" disabled={savingEdit || uploadingAvatar} onClick={saveEdit} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{savingEdit && <Spinner size="sm" />}{savingEdit ? "Saving..." : uploadingAvatar ? "Uploading avatar..." : "Save Changes"}</button>
            </div>
          </div>
        </Dialog>
      )}

      {passwordOpen && (
        <Dialog title="Reset Password" onClose={() => setPasswordOpen(false)}>
          <div className="space-y-4">
            {passwordError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>}
            <Field label="Current Password"><Input type="password" value={passwordForm.oldPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))} /></Field>
            <Field label="New Password"><Input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} /></Field>
            <Field label="Confirm New Password"><Input type="password" value={passwordForm.confirmNewPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmNewPassword: event.target.value }))} /></Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setPasswordOpen(false)} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600">Cancel</button>
              <button type="button" disabled={savingPassword} onClick={savePassword} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{savingPassword && <Spinner size="sm" />}{savingPassword ? "Saving..." : "Change Password"}</button>
            </div>
          </div>
        </Dialog>
      )}
      <Toast message={toast} />
    </>
  );
}
