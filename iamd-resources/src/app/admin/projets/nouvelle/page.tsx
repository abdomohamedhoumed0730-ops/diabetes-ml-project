import { ProjectForm } from "@/components/admin/project-form";
import { Alert, Breadcrumbs } from "@/components/ui";
import { getSubjectOptions } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";

export const metadata = { title: "Nouveau projet" };

export default async function NewProjectPage() {
  await requireAdminPage();
  const subjects = await getSubjectOptions();
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Projets", href: "/admin/projets" }, { label: "Nouveau projet" }]} />
      <h1 className="text-2xl font-bold text-brand-950">Nouveau projet</h1>
      <Alert tone="warning">
        Ne décrivez que des projets réels et des résultats vérifiés. Toute fiche illustrative doit être cochée « Exemple fictif ».
      </Alert>
      <div className="card p-6">
        <ProjectForm subjects={subjects} />
      </div>
    </div>
  );
}
