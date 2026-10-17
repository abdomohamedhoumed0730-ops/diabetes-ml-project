import { Alert } from "@/components/ui";
import type { ActionState } from "@/lib/validation";

export function FormMessage({ state }: { state: ActionState | null | undefined }) {
  if (!state?.message) return null;
  return <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>;
}

export function FieldError({ state, name }: { state: ActionState | null | undefined; name: string }) {
  const message = state?.errors?.[name];
  if (!message) return null;
  return (
    <p id={`${name}-error`} className="mt-1 text-xs text-red-700">
      {message}
    </p>
  );
}
