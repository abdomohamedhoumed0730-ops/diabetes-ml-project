import Link from "next/link";
import { Plus } from "lucide-react";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { getAdminSubjects } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";
import { firstParam } from "@/lib/validation";

export const metadata = { title: "Matières" };

export default async function AdminSubjectsPage({ searchParams }: PageProps<"/admin/matieres">) {
  await requireAdminPage();
  const [subjects, params] = await Promise.all([getAdminSubjects(), searchParams]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Matières</h1>
          <p className="text-sm text-slate-500">Ajoutez, modifiez, organisez ou supprimez les matières et leurs chapitres.</p>
        </div>
        <Link href="/admin/matieres/nouvelle" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" /> Nouvelle matière
        </Link>
      </div>
      {firstParam(params.supprime) ? <Alert tone="success">Matière supprimée.</Alert> : null}
      {subjects.length === 0 ? (
        <EmptyState title="Aucune matière" action={<Link href="/admin/matieres/nouvelle" className="btn-primary">Créer une matière</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Matière</th>
                <th scope="col" className="px-4 py-2 font-medium">Niveau / semestre</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Chapitres</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Ressources</th>
                <th scope="col" className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/matieres/${subject.id}`} className="font-medium text-brand-700 hover:underline">
                      {subject.name}
                    </Link>
                    <p className="font-mono text-xs text-slate-400">/{subject.slug}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {subject.level?.name} · {subject.semester?.name ?? "semestre à préciser"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{subject.chapters[0]?.count ?? 0}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{subject.resources[0]?.count ?? 0}</td>
                  <td className="px-4 py-2.5">{subject.is_published ? <Badge tone="accent">Publiée</Badge> : <Badge tone="amber">Masquée</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
