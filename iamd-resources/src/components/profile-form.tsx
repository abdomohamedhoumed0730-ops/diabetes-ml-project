"use client";

import { useActionForm } from "@/components/use-action-form";
import { updateProfile } from "@/app/actions/profile";
import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function ProfileForm({ fullName }: { fullName: string }) {
  const { state, pending, formProps } = useActionForm(updateProfile);
  return (
    <form {...formProps} className="space-y-3">
      <FormMessage state={state} />
      <div>
        <label htmlFor="full_name" className="label">
          Nom complet
        </label>
        <input id="full_name" name="full_name" defaultValue={fullName} maxLength={120} className="input" />
        <FieldError state={state} name="full_name" />
      </div>
      <SubmitButton pending={pending} className="btn-secondary">Enregistrer</SubmitButton>
    </form>
  );
}
