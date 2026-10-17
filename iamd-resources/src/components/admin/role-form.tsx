"use client";

import { useActionForm } from "@/components/use-action-form";
import { setUserRole } from "@/app/admin/_actions/users";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function RoleForm({ userId, role }: { userId: string; role: "admin" | "student" }) {
  const { state, pending, formProps } = useActionForm(setUserRole);
  return (
    <div className="space-y-1">
      <form {...formProps} className="flex items-center gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <label className="sr-only" htmlFor={`role-${userId}`}>Rôle</label>
        <select id={`role-${userId}`} name="role" defaultValue={role} className="input w-auto py-1.5">
          <option value="student">Étudiant</option>
          <option value="admin">Administrateur</option>
        </select>
        <SubmitButton pending={pending} className="btn-secondary py-1.5" pendingLabel="…">Appliquer</SubmitButton>
      </form>
      <FormMessage state={state} />
    </div>
  );
}
