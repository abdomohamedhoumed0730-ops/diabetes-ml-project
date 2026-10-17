"use client";

import { useState } from "react";
import { Eye, ExternalLink } from "lucide-react";

/**
 * L'aperçu n'est chargé qu'à la demande : utile sur les connexions lentes et
 * sur mobile, où l'affichage intégré des PDF n'est pas toujours pris en charge.
 */
export function FilePreview({ url, kind, title }: { url: string; kind: "pdf" | "image"; title: string }) {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm text-slate-600">
          {kind === "pdf" ? "Aperçu du PDF disponible." : "Aperçu de l'image disponible."} Le chargement peut prendre un moment sur une connexion lente.
        </p>
        <button type="button" className="btn-primary" onClick={() => setVisible(true)}>
          <Eye className="h-4 w-4" aria-hidden="true" />
          Afficher l&apos;aperçu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {kind === "pdf" ? (
        <iframe src={url} title={`Aperçu : ${title}`} className="h-[75vh] w-full rounded-xl border border-slate-200 bg-slate-100" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="mx-auto max-h-[75vh] rounded-xl border border-slate-200" />
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Ouvrir dans un nouvel onglet (recommandé sur téléphone)
      </a>
    </div>
  );
}
