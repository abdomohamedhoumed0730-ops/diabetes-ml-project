import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FilePlus2 } from "lucide-react";
import { z } from "zod";
import { deleteProject } from "@/app/admin/_actions/projects";
import { DeleteButton } from "@/components/admin/delete-button";
import { ProjectForm } from "@/components/admin/project-form";
import { Alert, Badge, Breadcrumbs } from "@/components/ui";
import { getAdminProject, getAdminResources, getSubjectOptions } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { firstParam } from "@/lib/validation";

export const metadata = { title: "Modifier un projet" };

export default async function EditProjectPage({ params, searchParams }: PageProps<"/admin/projets/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [project, subjects, files, query] = await Promise.all([
    getAdminProject(id),
    getSubjectOptions(),
    getAdminResources({ projectId: id }),
    searchParams,
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Projets", href: "/admin/projets" }, { label: project.title }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-950">{project.title}</h1>
        <Link href={`/projets/${project.slug}`} className="btn-secondary">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Voir la fiche
        </Link>
      </div>
      {firstParam(query.cree) ? <Alert tone="success">Projet créé. Ajoutez maintenant ses fichiers (rapport, code, données, captures).</Alert> : null}

      <section className="card p-6" aria-labelledby="files-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="files-title" className="font-semibold text-slate-800">
            Fichiers du projet
          </h2>
          <Link href={`/admin/ressources/nouvelle?projet=${project.id}`} className="btn-primary">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Ajouter un fichier
          </Link>
        </div>
        {files.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucun fichier. Utilisez le type « Fichier de projet » pour le rapport PDF ou le code, « Jeu de données » pour les données (si leur
            partage est autorisé) et « Capture d&apos;écran » pour les images.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {files.map((file) => (
              <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/admin/ressources/${file.id}`} className="text-brand-700 hover:underline">
                  {file.title}
                </Link>
                <span className="flex gap-2">
                  <Badge>{RESOURCE_TYPE_LABELS[file.type]}</Badge>
                  {file.is_published ? <Badge tone="accent">Publié</Badge> : <Badge tone="amber">Brouillon</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-800">Informations du projet</h2>
        <ProjectForm project={project} subjects={subjects} />
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-red-800">Supprimer le projet</h2>
        <p className="mt-1 mb-3 text-sm text-slate-600">Les fichiers rattachés au projet seront également supprimés.</p>
        <DeleteButton action={deleteProject} fields={{ id: project.id }} confirmMessage={`Supprimer définitivement le projet « ${project.title} » et ses fichiers ?`} />
      </section>
    </div>
  );
}
