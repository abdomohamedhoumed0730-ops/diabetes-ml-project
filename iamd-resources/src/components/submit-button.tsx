"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel = "Enregistrement…",
  className = "btn-primary",
  name,
  value,
  pending: pendingOverride,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
  /** État fourni par useActionForm (useFormStatus ne voit que les actions de formulaire natives). */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;
  return (
    <button type="submit" name={name} value={value} disabled={pending} aria-disabled={pending} className={clsx(className)}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
