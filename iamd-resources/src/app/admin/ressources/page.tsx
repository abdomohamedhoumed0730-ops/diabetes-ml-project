import Link from "next/link";
import { Plus } from "lucide-react";
import { z } from "zod";
import { setResourcePublished } from "@/app/admin/_actions/resources";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { getAdminResources, getSubjectOptions } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatBytes } from "@/lib/files";
import { formatDate } from "@/lib/format";
import { firstParam } from "@/lib/validation";

export const metadata = { title: "Ressources" };

export default async function AdminResourcesPage({ searchParams }: PageProps<"/admin/ressources">) {
  await requireAdminPage();
  const params = await searchParams;
  const statusParam = firstParam(params.statut);
  const status = statusParam === "published" || statusParam === "draft" ? statusParam : undefined;
  const subjectParam = firstParam(params.matiere);
  const subjectId = z.uuid().safeParse(subjectParam).success ? subjectParam : undefined;
  const q = firstParam(params.q)?.slice(0, 100) || undefined;

  const [resources, subjects] = await Promise.all([getAdminResources({ status, subjectId, q }), getSubjectOptions()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Ressources</h1>
          <p className="text-sm text-slate-500">Documents téléversés et liens externes. Publiez ou dépubliez en un clic.</p>
        </div>
        <Link href="/admin/ressources/nouvelle" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter une ressource
        </Link>
      </div>
      {firstParam(params.cree) ? <Alert tone="success">Ressource enregistrée.</Alert> : null}
      {firstParam(params.supprime) ? <Alert tone="success">Ressource supprimée.</Alert> : null}

      <form method="get" className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label htmlFor="q" className="label">Titre</label>
          <input id="q" name="q" defaultValue={q} className="input" placeholder="Rechercher…" />
        </div>
        <div>
          <label htmlFor="statut" className="label">Statut</label>
          <select id="statut" name="statut" defaultValue={status ?? ""} className="input">
            <option value="">Tous</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>
        <div>
          <label htmlFor="matiere" className="label">Matière</label>
          <select id="matiere" name="matiere" defaultValue={subjectId ?? ""} className="input">
            <option value="">Toutes</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-secondary">Filtrer</button>
      </form>

      {resources.length === 0 ? (
        <EmptyState
          title="Aucune ressource"
          description="Aucun document ne correspond à ces critères. Ajoutez votre premier support de cours, exercice ou TP."
          action={<Link href="/admin/ressources/nouvelle" className="btn-primary">Ajouter une ressource</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Ressource</th>
                <th scope="col" className="px-4 py-2 font-medium">Rattachement</th>
                <th scope="col" className="px-4 py-2 font-medium">Ajout</th>
                <th scope="col" className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources.map((resource) => (
                <tr key={resource.id} className="align-top">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/ressources/${resource.id}`} className="font-medium text-brand-700 hover:underline">
                      {resource.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {RESOURCE_TYPE_LABELS[resource.type]} ·{" "}
                      {resource.external_url ? "Lien externe" : `${resource.file_name} (${formatBytes(resource.file_size ?? 0)})`}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{[resource.subject?.name, resource.project?.title].filter(Boolean).join(" · ")}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{formatDate(resource.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <form action={setResourcePublished} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={resource.id} />
                      <input type="hidden" name="published" value={resource.is_published ? "false" : "true"} />
                      {resource.is_published ? <Badge tone="accent">Publiée</Badge> : <Badge tone="amber">Brouillon</Badge>}
                      <SubmitButton className="btn-secondary px-2 py-1 text-xs" pendingLabel="…">
                        {resource.is_published ? "Dépublier" : "Publier"}
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
