import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/espace");
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-brand-950">Créer un compte</h1>
        <p className="mt-1 text-sm text-slate-600">
          La consultation des ressources reste libre sans compte. Un compte étudiant permet d&apos;ajouter des favoris et de conserver
          l&apos;historique des documents consultés.
        </p>
        <div className="mt-6">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
