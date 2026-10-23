import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

export const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

/** Label + input + hint or validation error. */
export function SettingField({ label, hint, error, children, className = "" }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-xs text-red-600">{error}</span> : hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

/** Form body with the Discard / Save footer shared by every settings section. */
export function SettingsForm({ children, onSubmit, onDiscard, isDirty, saving }: { children: ReactNode; onSubmit: () => void; onDiscard: () => void; isDirty: boolean; saving: boolean }) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
      <div className="mt-8 flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
        {isDirty && <span className="mr-auto text-xs font-medium text-amber-600">Unsaved changes</span>}
        <button type="button" disabled={!isDirty || saving} onClick={onDiscard} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          Discard
        </button>
        <button type="submit" disabled={!isDirty || saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {saving && <Spinner size="sm" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
