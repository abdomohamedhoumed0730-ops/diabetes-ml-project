"use client";

import { useActionForm } from "@/components/use-action-form";
import Link from "next/link";
import { signIn, signUp } from "@/app/actions/auth";
import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function SignInForm({ next }: { next?: string }) {
  const { state, pending, formProps } = useActionForm(signIn);
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? "/espace"} />
      <div>
        <label htmlFor="email" className="label">
          Adresse e-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" aria-invalid={Boolean(state?.errors?.email)} aria-describedby="email-error" />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" aria-invalid={Boolean(state?.errors?.password)} aria-describedby="password-error" />
        <FieldError state={state} name="password" />
      </div>
      <SubmitButton pending={pending} className="btn-primary w-full" pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>
      <p className="text-center text-sm text-slate-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-brand-700 hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const { state, pending, formProps } = useActionForm(signUp);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <label htmlFor="full_name" className="label">
          Nom complet
        </label>
        <input id="full_name" name="full_name" autoComplete="name" required maxLength={120} className="input" aria-invalid={Boolean(state?.errors?.full_name)} aria-describedby="full_name-error" />
        <FieldError state={state} name="full_name" />
      </div>
      <div>
        <label htmlFor="email" className="label">
          Adresse e-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" aria-invalid={Boolean(state?.errors?.email)} aria-describedby="email-error" />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" aria-invalid={Boolean(state?.errors?.password)} aria-describedby="password-error password-help" />
        <p id="password-help" className="mt-1 text-xs text-slate-500">
          8 caractères minimum, avec au moins une lettre et un chiffre.
        </p>
        <FieldError state={state} name="password" />
      </div>
      <div>
        <label htmlFor="password_confirm" className="label">
          Confirmer le mot de passe
        </label>
        <input id="password_confirm" name="password_confirm" type="password" autoComplete="new-password" required className="input" aria-invalid={Boolean(state?.errors?.password_confirm)} aria-describedby="password_confirm-error" />
        <FieldError state={state} name="password_confirm" />
      </div>
      <SubmitButton pending={pending} className="btn-primary w-full" pendingLabel="Création du compte…">
        Créer mon compte
      </SubmitButton>
      <p className="text-center text-sm text-slate-600">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-brand-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
