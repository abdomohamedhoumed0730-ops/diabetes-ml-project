import { z } from "zod";
import { ResourceForm } from "@/components/admin/resource-form";
import { Alert, Breadcrumbs } from "@/components/ui";
import { getProjectOptions, getSubjectOptions } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";
import { firstParam } from "@/lib/validation";

export const metadata = { title: "Ajouter une ressource" };

export default async function NewResourcePage({ searchParams }: PageProps<"/admin/ressources/nouvelle">) {
  await requireAdminPage();
  const params = await searchParams;
  const subject = firstParam(params.matiere);
  const project = firstParam(params.projet);
  const [subjects, projects] = await Promise.all([getSubjectOptions(), getProjectOptions()]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Ressources", href: "/admin/ressources" }, { label: "Ajouter une ressource" }]} />
      <h1 className="text-2xl font-bold text-brand-950">Ajouter une ressource</h1>
      <Alert tone="warning">
        Ne publiez que des documents que vous êtes autorisé à diffuser. Indiquez toujours la source, et l&apos;auteur et la licence lorsqu&apos;ils
        sont connus. Pour un support protégé sans autorisation, ajoutez plutôt un lien vers sa source officielle.
      </Alert>
      <div className="card p-6">
        <ResourceForm
          subjects={subjects}
          projects={projects}
          defaultSubjectId={z.uuid().safeParse(subject).success ? subject : undefined}
          defaultProjectId={z.uuid().safeParse(project).success ? project : undefined}
        />
      </div>
    </div>
  );
}
