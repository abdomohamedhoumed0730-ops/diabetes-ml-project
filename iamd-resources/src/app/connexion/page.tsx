import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth-forms";
import { Alert } from "@/components/ui";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { firstParam } from "@/lib/validation";

export const metadata: Metadata = { title: "Connexion" };

export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = safeNextPath(firstParam(params.next));
  if (await getCurrentUser()) redirect(next);
  const confirmError = firstParam(params.erreur) === "confirmation";

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-brand-950">Connexion</h1>
        <p className="mt-1 text-sm text-slate-600">
          Le compte est facultatif : il permet d&apos;enregistrer des favoris et de retrouver votre historique.
        </p>
        <div className="mt-6 space-y-4">
          {confirmError ? <Alert tone="error">Le lien de confirmation est invalide ou a expiré.</Alert> : null}
          <SignInForm next={next} />
        </div>
      </div>
    </div>
  );
}
