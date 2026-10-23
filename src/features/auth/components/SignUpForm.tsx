import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas/auth.schema";
import { getApiErrorMessage } from "@/lib/api/errors";

export default function SignUpForm() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" } });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError("");
    try {
      await register(values);
      navigate("/auth/login", { replace: true, state: { message: "Registration successful. You can now sign in." } });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  const field = (name: keyof RegisterFormValues, type: string, placeholder: string) => (
    <Controller name={name} control={control} render={({ field: controllerField }) => <Input {...controllerField} type={type} placeholder={placeholder} error={Boolean(errors[name])} hint={errors[name]?.message} />} />
  );

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10"><Link to="/" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"><ChevronLeftIcon className="size-5" /> Back to dashboard</Link></div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8"><h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Create account</h1><p className="text-sm text-gray-500 dark:text-gray-400">Register your customer account.</p></div>
        {serverError && <p role="alert" className="mb-5 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">{serverError}</p>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><div><Label>First name <span className="text-error-500">*</span></Label>{field("firstName", "text", "John")}</div><div><Label>Last name <span className="text-error-500">*</span></Label>{field("lastName", "text", "Doe")}</div></div>
            <div><Label>Email <span className="text-error-500">*</span></Label>{field("email", "email", "you@example.com")}</div>
            <div><Label>Password <span className="text-error-500">*</span></Label><div className="relative">{field("password", showPassword ? "text" : "password", "At least 8 characters")}<button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">{showPassword ? <EyeIcon className="fill-current size-5" /> : <EyeCloseIcon className="fill-current size-5" />}</button></div></div>
            <div><Label>Confirm password <span className="text-error-500">*</span></Label><div className="relative">{field("confirmPassword", showConfirmPassword ? "text" : "password", "Repeat your password")}<button type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">{showConfirmPassword ? <EyeIcon className="fill-current size-5" /> : <EyeCloseIcon className="fill-current size-5" />}</button></div></div>
            <Button className="w-full" size="sm" disabled={isLoading} startIcon={isLoading ? <Spinner size="sm" /> : undefined}>{isLoading ? "Creating account..." : "Create account"}</Button>
          </div>
        </form>
        <p className="mt-5 text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">Already have an account? <Link to="/auth/login" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign In</Link></p>
      </div>
    </div>
  );
}
