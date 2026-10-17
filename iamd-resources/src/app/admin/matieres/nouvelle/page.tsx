import { SubjectForm } from "@/components/admin/subject-form";
import { Breadcrumbs } from "@/components/ui";
import { getLevelOptions } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";

export const metadata = { title: "Nouvelle matière" };

export default async function NewSubjectPage() {
  await requireAdminPage();
  const levels = await getLevelOptions();
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Matières", href: "/admin/matieres" }, { label: "Nouvelle matière" }]} />
      <h1 className="text-2xl font-bold text-brand-950">Nouvelle matière</h1>
      <div className="card p-6">
        <SubjectForm levels={levels} />
      </div>
    </div>
  );
}
