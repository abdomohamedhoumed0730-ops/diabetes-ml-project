import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FilePlus2 } from "lucide-react";
import { z } from "zod";
import { deleteSubject } from "@/app/admin/_actions/catalog";
import { ChapterManager } from "@/components/admin/chapter-manager";
import { DeleteButton } from "@/components/admin/delete-button";
import { SubjectForm } from "@/components/admin/subject-form";
import { Alert, Breadcrumbs } from "@/components/ui";
import { getAdminSubject, getLevelOptions } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";
import { firstParam } from "@/lib/validation";

export const metadata = { title: "Modifier une matière" };

export default async function EditSubjectPage({ params, searchParams }: PageProps<"/admin/matieres/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [subject, levels, query] = await Promise.all([getAdminSubject(id), getLevelOptions(), searchParams]);
  if (!subject) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Matières", href: "/admin/matieres" }, { label: subject.name }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-950">{subject.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`/matieres/${subject.slug}`} className="btn-secondary">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Voir la page
          </Link>
          <Link href={`/admin/ressources/nouvelle?matiere=${subject.id}`} className="btn-primary">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Ajouter une ressource
          </Link>
        </div>
      </div>
      {firstParam(query.cree) ? <Alert tone="success">Matière créée. Vous pouvez maintenant ajouter ses chapitres.</Alert> : null}

      <section className="card p-6" aria-labelledby="chapters-title">
        <h2 id="chapters-title" className="mb-4 font-semibold text-slate-800">
          Chapitres
        </h2>
        <ChapterManager subjectId={subject.id} chapters={subject.chapters} />
      </section>

      <section className="card p-6" aria-labelledby="info-title">
        <h2 id="info-title" className="mb-4 font-semibold text-slate-800">
          Informations de la matière
        </h2>
        <SubjectForm subject={subject} levels={levels} />
      </section>

      <section className="card border-red-100 p-6" aria-labelledby="danger-title">
        <h2 id="danger-title" className="font-semibold text-red-800">
          Supprimer la matière
        </h2>
        <p className="mt-1 mb-3 text-sm text-slate-600">
          La suppression n&apos;est possible que si la matière ne contient plus aucune ressource. Pour la masquer temporairement, décochez
          « Matière publiée ».
        </p>
        <DeleteButton action={deleteSubject} fields={{ id: subject.id }} confirmMessage={`Supprimer définitivement « ${subject.name} » et ses chapitres ?`} />
      </section>
    </div>
  );
}
