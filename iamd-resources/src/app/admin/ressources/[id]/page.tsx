import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { z } from "zod";
import { deleteResource } from "@/app/admin/_actions/resources";
import { DeleteButton } from "@/components/admin/delete-button";
import { ResourceForm } from "@/components/admin/resource-form";
import { Breadcrumbs } from "@/components/ui";
import { getAdminResource, getProjectOptions, getSubjectOptions } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";

export const metadata = { title: "Modifier une ressource" };

export default async function EditResourcePage({ params }: PageProps<"/admin/ressources/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [resource, subjects, projects] = await Promise.all([getAdminResource(id), getSubjectOptions(), getProjectOptions()]);
  if (!resource) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Ressources", href: "/admin/ressources" }, { label: resource.title }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-950">Modifier la ressource</h1>
        <Link href={`/ressources/${resource.id}`} className="btn-secondary">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Voir la page
        </Link>
      </div>
      <div className="card p-6">
        <ResourceForm resource={resource} subjects={subjects} projects={projects} />
      </div>
      <section className="card p-6">
        <h2 className="font-semibold text-red-800">Supprimer la ressource</h2>
        <p className="mt-1 mb-3 text-sm text-slate-600">Le fichier est supprimé définitivement du stockage, ainsi que ses statistiques.</p>
        <DeleteButton action={deleteResource} fields={{ id: resource.id }} confirmMessage={`Supprimer définitivement « ${resource.title} » ?`} />
      </section>
    </div>
  );
}
