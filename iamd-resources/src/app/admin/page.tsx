import Link from "next/link";
import { Download, Eye, FilePlus2, FolderPlus } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { getAdminOverview } from "@/lib/admin-queries";
import { RESOURCE_TYPE_LABELS, type ResourceType } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminDashboard() {
  await requireAdminPage();
  const stats = await getAdminOverview(30);
  const tiles = [
    { label: "Matières", value: stats.subjects, href: "/admin/matieres" },
    { label: "Ressources publiées", value: stats.resources_published, href: "/admin/ressources?statut=published" },
    { label: "Brouillons", value: stats.resources_draft, href: "/admin/ressources?statut=draft" },
    { label: "Projets", value: stats.projects, href: "/admin/projets" },
    { label: "Comptes", value: stats.users, href: "/admin/utilisateurs" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-950">Tableau de bord</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/ressources/nouvelle" className="btn-primary">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Ajouter un document
          </Link>
          <Link href="/admin/projets/nouvelle" className="btn-secondary">
            <FolderPlus className="h-4 w-4" aria-hidden="true" /> Nouveau projet
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="card-hover p-4">
            <dt className="text-xs text-slate-500">{tile.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-brand-900 tabular-nums">{tile.value}</dd>
          </Link>
        ))}
      </dl>

      <section aria-labelledby="activity-title" className="card p-5">
        <h2 id="activity-title" className="font-semibold text-slate-800">
          Activité des 30 derniers jours
        </h2>
        <div className="mt-3 flex flex-wrap gap-6 text-sm">
          <p className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <span className="text-xl font-semibold tabular-nums">{stats.views}</span> consultations
          </p>
          <p className="flex items-center gap-2">
            <Download className="h-4 w-4 text-accent-600" aria-hidden="true" />
            <span className="text-xl font-semibold tabular-nums">{stats.downloads}</span> téléchargements
          </p>
        </div>
        {stats.daily.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Activité quotidienne</caption>
              <thead className="text-xs text-slate-500">
                <tr>
                  <th scope="col" className="py-1.5 pr-4 font-medium">Jour</th>
                  <th scope="col" className="py-1.5 pr-4 text-right font-medium">Consultations</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Téléchargements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...stats.daily].reverse().slice(0, 14).map((day) => (
                  <tr key={day.day}>
                    <td className="py-1.5 pr-4">{formatDate(day.day)}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{day.views}</td>
                    <td className="py-1.5 text-right tabular-nums">{day.downloads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="top-title">
        <h2 id="top-title" className="mb-3 font-semibold text-slate-800">
          Ressources les plus consultées (30 jours)
        </h2>
        {stats.top_resources.length === 0 ? (
          <EmptyState title="Aucune consultation enregistrée sur la période" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Ressource</th>
                  <th scope="col" className="px-4 py-2 font-medium">Type</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Consultations</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Téléchargements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.top_resources.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2">
                      <Link href={`/ressources/${row.id}`} className="text-brand-700 hover:underline">
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{RESOURCE_TYPE_LABELS[row.type as ResourceType] ?? row.type}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.views}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.downloads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
