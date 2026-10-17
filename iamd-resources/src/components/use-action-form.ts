"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { ActionState } from "@/lib/validation";

type Action = (prev: ActionState | null, formData: FormData) => Promise<ActionState>;

/**
 * Soumet un formulaire à une action serveur SANS la réinitialisation automatique
 * de React 19 : en cas d'erreur de validation, la saisie de l'utilisateur est conservée.
 */
export function useActionForm(action: Action, options: { resetOnSuccess?: boolean } = {}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const { resetOnSuccess = false } = options;

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return { state, pending, formProps: { ref, onSubmit } };
}
