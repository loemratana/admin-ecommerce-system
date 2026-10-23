import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Camera, Pencil, Plus, Star, Trash2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FadeIn from "@/components/common/FadeIn";
import { ListSkeleton } from "@/components/common/Skeletons";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getApiErrorMessage } from "@/lib/api/errors";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  useAddAddress,
  useDeleteAddress,
  useMe,
  useMyAddresses,
  useSetDefaultAddress,
  useUpdateAddress,
  useUpdateProfile,
  useUploadAvatar,
} from "@/features/profile/hooks/useProfile";
import type { Address, AddressPayload } from "@/features/users/types/user.types";

const emptyAddress: AddressPayload = { street: "", city: "", state: "", zipCode: "", country: "" };

// Mirrors the backend check in UserServiceImpl.updateAvatar (no SVG) and the 10MB multipart limit.
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const email = useAuthStore((state) => state.email);
  const role = user?.role?.[0]?.roleName || "CUSTOMER";

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  // profileImage is not part of this form: the avatar is uploaded and saved on its own (see handleAvatarFile)
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState("");

  const [addressDialog, setAddressDialog] = useState<{ mode: "create" | "edit"; target?: Address } | null>(null);
  const [addressForm, setAddressForm] = useState<AddressPayload>(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);

  const meQuery = useMe();
  const addressesQuery = useMyAddresses();
  const addresses = addressesQuery.data ?? [];
  const loading = meQuery.isLoading || addressesQuery.isLoading;
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const uploadingAvatar = uploadAvatarMutation.isPending;
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const defaultAddressMutation = useSetDefaultAddress();

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const openEdit = () => {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    });
    setError("");
    setEditOpen(true);
  };

  const handleAvatarFile = async (file: File | undefined) => {
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (!file) return;
    setAvatarError("");
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Please choose a PNG, JPG, WEBP or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be 10MB or smaller.");
      return;
    }
    try {
      await uploadAvatarMutation.mutateAsync(file);
      setMessage("Profile photo updated.");
    } catch (err) {
      setAvatarError(getApiErrorMessage(err));
    }
  };

  const removeAvatar = async () => {
    setAvatarError("");
    try {
      // "" clears it: the backend only skips null fields on profile update
      await updateProfileMutation.mutateAsync({ profileImage: "" });
      setMessage("Profile photo removed.");
    } catch (err) {
      setAvatarError(getApiErrorMessage(err));
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setError("");
    try {
      await updateProfileMutation.mutateAsync(profileForm);
      setEditOpen(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const openCreateAddress = () => {
    setAddressForm(emptyAddress);
    setError("");
    setAddressDialog({ mode: "create" });
  };

  const openEditAddress = (address: Address) => {
    setAddressForm({ street: address.street, city: address.city, state: address.state, zipCode: address.zipCode, country: address.country });
    setError("");
    setAddressDialog({ mode: "edit", target: address });
  };

  const saveAddress = async () => {
    setSavingAddress(true);
    setError("");
    try {
      if (addressDialog?.mode === "edit" && addressDialog.target) {
        await updateAddressMutation.mutateAsync({ id: addressDialog.target.id, payload: addressForm });
        setMessage("Address updated.");
      } else {
        await addAddressMutation.mutateAsync(addressForm);
        setMessage("Address added.");
      }
      setAddressDialog(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSavingAddress(false);
    }
  };

  const removeAddress = async (address: Address) => {
    try {
      await deleteAddressMutation.mutateAsync(address.id);
      setMessage("Address deleted.");
    } catch (err) {
      setMessage(getApiErrorMessage(err));
    }
  };

  const makeDefault = async (address: Address) => {
    try {
      await defaultAddressMutation.mutateAsync(address.id);
      setMessage("Default address updated.");
    } catch (err) {
      setMessage(getApiErrorMessage(err));
    }
  };

  return (
    <>
      <PageMeta title="Profile | E-Commerce Admin" description="View your account profile." />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your account information and security settings.</p>
        </div>

        {message && <p role="status" className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{message}</p>}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <input ref={avatarInputRef} type="file" accept={AVATAR_TYPES.join(",")} hidden onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar || loading}
                title="Change profile photo"
                aria-label="Change profile photo"
                className="group relative size-16 shrink-0 overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-wait"
              >
                <img src={user?.profileImage || "/images/user/owner.jpg"} alt="Profile" className="size-full object-cover" />
                <span className={`absolute inset-0 flex items-center justify-center bg-gray-900/50 text-white transition ${uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
                  {uploadingAvatar ? <Spinner size="md" /> : <Camera className="size-5" />}
                </span>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{user?.name || "Customer account"}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || email || "Your signed-in email"}</p>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar || loading} className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 dark:text-brand-400">
                    {uploadingAvatar ? "Uploading..." : "Change photo"}
                  </button>
                  {user?.profileImage && !uploadingAvatar && (
                    <button type="button" onClick={removeAvatar} disabled={updateProfileMutation.isPending} className="font-medium text-gray-500 hover:text-error-600 disabled:opacity-50">
                      Remove photo
                    </button>
                  )}
                </div>
                {avatarError && <p role="alert" className="mt-1 text-xs text-error-600 dark:text-error-400">{avatarError}</p>}
              </div>
            </div>
            <Button variant="outline" onClick={openEdit} disabled={loading}>
              <Pencil className="size-4" /> Edit profile
            </Button>
          </div>
          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Account status</dt><dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{user?.active === false ? "Inactive" : "Active"}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Role</dt><dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{role}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Phone</dt><dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{user?.phone || "Not set"}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Created</dt><dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Available after account sync"}</dd></div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/profile/security"><Button variant="outline">Security settings</Button></Link>
            <Link to="/profile/security/devices"><Button>View devices</Button></Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white/90">Addresses</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your saved shipping addresses.</p>
            </div>
            <Button variant="outline" onClick={openCreateAddress}><Plus className="size-4" /> Add address</Button>
          </div>
          {loading ? (
            <div className="mt-6"><ListSkeleton rows={2} /></div>
          ) : addresses.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No saved addresses yet.</p>
          ) : (
            <FadeIn className="mt-6 grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <div key={address.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-medium text-gray-800 dark:text-white/90">{address.street}</p>
                      <p>{address.city}, {address.state} {address.zipCode}</p>
                      <p>{address.country}</p>
                    </div>
                    {address.isDefault && <span className="flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400"><Star className="size-3" /> Default</span>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!address.isDefault && <Button variant="outline" size="sm" onClick={() => makeDefault(address)}>Set as default</Button>}
                    <Button variant="outline" size="sm" onClick={() => openEditAddress(address)}><Pencil className="size-3.5" /> Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => removeAddress(address)}><Trash2 className="size-3.5" /> Delete</Button>
                  </div>
                </div>
              ))}
            </FadeIn>
          )}
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} className="max-w-md m-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit profile</h2>
          {error && <p role="alert" className="mt-3 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">{error}</p>}
          <div className="mt-5 space-y-4">
            <div><Label>First name</Label><Input value={profileForm.firstName} onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))} /></div>
            <div><Label>Last name</Label><Input value={profileForm.lastName} onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} /></div>          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={savingProfile} startIcon={savingProfile ? <Spinner size="sm" /> : undefined}>{savingProfile ? "Saving..." : "Save changes"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(addressDialog)} onClose={() => setAddressDialog(null)} className="max-w-md m-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{addressDialog?.mode === "edit" ? "Edit address" : "Add address"}</h2>
          {error && <p role="alert" className="mt-3 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">{error}</p>}
          <div className="mt-5 space-y-4">
            <div><Label>Street</Label><Input value={addressForm.street} onChange={(event) => setAddressForm((current) => ({ ...current, street: event.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>City</Label><Input value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} /></div>
              <div><Label>State</Label><Input value={addressForm.state} onChange={(event) => setAddressForm((current) => ({ ...current, state: event.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Zip code</Label><Input value={addressForm.zipCode} onChange={(event) => setAddressForm((current) => ({ ...current, zipCode: event.target.value }))} /></div>
              <div><Label>Country</Label><Input value={addressForm.country} onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))} /></div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddressDialog(null)}>Cancel</Button>
            <Button onClick={saveAddress} disabled={savingAddress} startIcon={savingAddress ? <Spinner size="sm" /> : undefined}>{savingAddress ? "Saving..." : "Save address"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
