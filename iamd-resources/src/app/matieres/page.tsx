import Link from "next/link";
import type { Metadata } from "next";
import clsx from "clsx";
import { SubjectCard } from "@/components/cards";
import { Breadcrumbs, EmptyState, PageHeader } from "@/components/ui";
import { getLevels, getSubjects } from "@/lib/queries";
import { firstParam } from "@/lib/validation";

export const metadata: Metadata = { title: "Matières" };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function SubjectsPage({ searchParams }: PageProps<"/matieres">) {
  const levelParam = firstParam((await searchParams).niveau);
  const levelId = levelParam && UUID.test(levelParam) ? levelParam : undefined;
  const [levels, subjects] = await Promise.all([getLevels(), getSubjects({ levelId })]);

  return (
    <>
      <PageHeader
        title="Matières"
        description="Chaque matière regroupe présentation, chapitres, supports, exercices, TP, projets et sujets d'examens."
      >
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Matières" }]} />
      </PageHeader>
      <div className="container-page py-8">
        <nav aria-label="Filtrer par niveau" className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/matieres"
            className={clsx("rounded-full px-3 py-1.5 text-sm font-medium", !levelId ? "bg-brand-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
            aria-current={!levelId ? "page" : undefined}
          >
            Tous les niveaux
          </Link>
          {levels.map((level) => (
            <Link
              key={level.id}
              href={`/matieres?niveau=${level.id}`}
              className={clsx(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                levelId === level.id ? "bg-brand-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
              aria-current={levelId === level.id ? "page" : undefined}
            >
              {level.name}
              {level.program?.short_name ? ` · ${level.program.short_name}` : ""}
            </Link>
          ))}
        </nav>
        {subjects.length === 0 ? (
          <EmptyState title="Aucune matière pour ce niveau" description="Les matières de ce niveau n'ont pas encore été ajoutées." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
