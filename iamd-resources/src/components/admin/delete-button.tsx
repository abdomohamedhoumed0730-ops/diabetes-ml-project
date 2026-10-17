"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/lib/validation";

/** Bouton de suppression avec confirmation ; l'autorisation est vérifiée côté serveur. */
export function DeleteButton({
  action,
  fields,
  confirmMessage,
  label = "Supprimer",
  compact = false,
}: {
  action: (prev: ActionState | null, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  confirmMessage: string;
  label?: string;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <div className="space-y-2">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(confirmMessage)) event.preventDefault();
        }}
      >
        {Object.entries(fields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <SubmitButton className={compact ? "btn-danger px-2.5 py-1.5" : "btn-danger"} pendingLabel="Suppression…">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {compact ? <span className="sr-only">{label}</span> : label}
        </SubmitButton>
      </form>
      {state && !state.ok ? <FormMessage state={state} /> : null}
    </div>
  );
}
