import { useState } from "react";
import { Link, useNavigate } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Spinner } from "@/components/ui/spinner";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useChangePassword } from "@/features/profile/hooks/useProfile";
import { changePasswordSchema } from "@/features/profile/schemas/profile.schema";

const emptyPasswordForm = { oldPassword: "", newPassword: "", confirmNewPassword: "" };

export default function SecurityPage() {
  const navigate = useNavigate();
  const logoutAll = useAuthStore((state) => state.logoutAll);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const changePasswordMutation = useChangePassword();
  const changingPassword = changePasswordMutation.isPending;

  const handleLogoutAll = async () => {
    setLoading(true);
    try {
      await logoutAll();
      navigate("/auth/login", { replace: true });
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    const parsed = changePasswordSchema.safeParse(passwordForm);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0].message);
      return;
    }
    try {
      await changePasswordMutation.mutateAsync(parsed.data);
      setPasswordForm(emptyPasswordForm);
      setPasswordSuccess("Password changed successfully.");
    } catch (error) {
      setPasswordError(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <PageMeta title="Security | E-Commerce Admin" description="Manage account security." />
      <PageBreadcrumb pageTitle="Security" />
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Security</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review account access and active sessions.</p></div>
        {message && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">{message}</p>}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="font-semibold text-gray-800 dark:text-white/90">Change password</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Use a strong password you don't use elsewhere.</p>
          {passwordError && <p role="alert" className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">{passwordError}</p>}
          {passwordSuccess && <p role="status" className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{passwordSuccess}</p>}
          <form onSubmit={changePassword} className="mt-5 max-w-md space-y-4">
            <div>
              <Label>Current password</Label>
              <Input type="password" value={passwordForm.oldPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))} />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input type="password" value={passwordForm.confirmNewPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmNewPassword: event.target.value }))} />
            </div>
            <Button size="sm" disabled={changingPassword} startIcon={changingPassword ? <Spinner size="sm" /> : undefined}>{changingPassword ? "Updating..." : "Update password"}</Button>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="font-semibold text-gray-800 dark:text-white/90">Account security</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your access token is short-lived and refreshed automatically while your session is active.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/profile/security/devices"><Button variant="outline">Manage devices</Button></Link>
            <Button onClick={handleLogoutAll} disabled={loading} startIcon={loading ? <Spinner size="sm" /> : undefined}>{loading ? "Signing out..." : "Log out all devices"}</Button>
          </div>
        </div>
      </div>
    </>
  );
}
