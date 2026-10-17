import Link from "next/link";
import { Plus } from "lucide-react";
import { setProjectPublished } from "@/app/admin/_actions/projects";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { getAdminProjects } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants";
import { firstParam } from "@/lib/validation";

export const metadata = { title: "Projets" };

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projets">) {
  await requireAdminPage();
  const [projects, params] = await Promise.all([getAdminProjects(), searchParams]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Projets</h1>
          <p className="text-sm text-slate-500">Fiches projets et fichiers associés (rapport, code, données, captures).</p>
        </div>
        <Link href="/admin/projets/nouvelle" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" /> Nouveau projet
        </Link>
      </div>
      {firstParam(params.supprime) ? <Alert tone="success">Projet supprimé.</Alert> : null}
      {projects.length === 0 ? (
        <EmptyState title="Aucun projet" action={<Link href="/admin/projets/nouvelle" className="btn-primary">Créer un projet</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Projet</th>
                <th scope="col" className="px-4 py-2 font-medium">Catégorie</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Fichiers</th>
                <th scope="col" className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/projets/${project.id}`} className="font-medium text-brand-700 hover:underline">
                      {project.title}
                    </Link>
                    {project.is_example ? <Badge tone="amber" className="ml-2">Exemple fictif</Badge> : null}
                    {project.subject ? <p className="text-xs text-slate-500">{project.subject.name}</p> : null}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{PROJECT_CATEGORY_LABELS[project.category]}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{project.resources[0]?.count ?? 0}</td>
                  <td className="px-4 py-2.5">
                    <form action={setProjectPublished} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={project.id} />
                      <input type="hidden" name="published" value={project.is_published ? "false" : "true"} />
                      {project.is_published ? <Badge tone="accent">Publié</Badge> : <Badge tone="amber">Brouillon</Badge>}
                      <SubmitButton className="btn-secondary px-2 py-1 text-xs" pendingLabel="…">
                        {project.is_published ? "Dépublier" : "Publier"}
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
