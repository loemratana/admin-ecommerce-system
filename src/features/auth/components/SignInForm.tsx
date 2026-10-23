import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/auth.schema";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getDeviceId, getDeviceName } from "@/features/auth/utils/device";

export default function SignInForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [serverError, setServerError] = useState("");
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError("");
    try {
      await login({ ...values, deviceId: getDeviceId(), deviceName: getDeviceName(), deviceType: "WEB" });
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || "/", { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"><ChevronLeftIcon className="size-5" /> Back to dashboard</Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8"><h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Sign In</h1><p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and password to sign in.</p></div>
        {serverError && <p role="alert" className="mb-5 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">{serverError}</p>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-6">
            <div><Label>Email <span className="text-error-500">*</span></Label><Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" placeholder="you@example.com" error={Boolean(errors.email)} hint={errors.email?.message} />} /></div>
            <div><Label>Password <span className="text-error-500">*</span></Label><div className="relative"><Controller name="password" control={control} render={({ field }) => <Input {...field} type={showPassword ? "text" : "password"} placeholder="Enter your password" error={Boolean(errors.password)} hint={errors.password?.message} />} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">{showPassword ? <EyeIcon className="fill-current size-5" /> : <EyeCloseIcon className="fill-current size-5" />}</button></div></div>
            <div className="flex items-center justify-between"><label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-400"><Checkbox checked={isChecked} onChange={setIsChecked} /> Keep me logged in</label><Link to="/reset-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">Forgot password?</Link></div>
            <Button className="w-full" size="sm" disabled={isLoading} startIcon={isLoading ? <Spinner size="sm" /> : undefined}>{isLoading ? "Signing in..." : "Sign in"}</Button>
          </div>
        </form>
        <p className="mt-5 text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">Don&apos;t have an account? <Link to="/auth/register" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign Up</Link></p>
      </div>
    </div>
  );
}
