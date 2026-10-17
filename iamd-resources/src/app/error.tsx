"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <div className="container-page py-16 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-brand-950">Une erreur est survenue</h1>
      <p className="mx-auto mt-2 max-w-lg text-slate-600">
        La page n&apos;a pas pu être chargée. Vérifiez votre connexion Internet puis réessayez. Si le problème persiste, contactez
        l&apos;administrateur du site.
      </p>
      {digest ? <p className="mt-2 text-xs text-slate-400">Référence : {digest}</p> : null}
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => retry()}>
          Réessayer
        </button>
        <Link href="/" className="btn-secondary">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
