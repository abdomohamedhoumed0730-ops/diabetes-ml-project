import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectCard } from "@/components/cards";
import { Alert, Breadcrumbs, EmptyState, PageHeader } from "@/components/ui";
import { getProgramTree } from "@/lib/queries";

export async function generateMetadata({ params }: PageProps<"/formations/[slug]">): Promise<Metadata> {
  const program = await getProgramTree((await params).slug);
  return { title: program?.name ?? "Formation" };
}

export default async function ProgramPage({ params }: PageProps<"/formations/[slug]">) {
  const program = await getProgramTree((await params).slug);
  if (!program) notFound();

  return (
    <>
      <PageHeader title={program.name} description={program.description}>
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Formations", href: "/formations" }, { label: program.short_name ?? program.name }]} />
      </PageHeader>
      <div className="container-page space-y-12 py-10">
        <Alert tone="info">
          L&apos;organisation des matières présentée ici est indicative et peut être modifiée par l&apos;administrateur pour suivre le
          programme officiel de la formation.
        </Alert>
        {program.levels.length === 0 ? <EmptyState title="Aucun niveau défini pour cette formation" /> : null}
        {program.levels.map((level) => {
          const unassigned = level.subjects.filter((subject) => !subject.semester_id);
          return (
            <section key={level.id} aria-labelledby={`level-${level.id}`}>
              <h2 id={`level-${level.id}`} className="section-title">
                {level.name}
              </h2>
              {level.subjects.length === 0 ? (
                <EmptyState className="mt-4" title={`Aucune matière pour ${level.name}`} />
              ) : null}
              {level.semesters.map((semester) => {
                const subjects = level.subjects.filter((subject) => subject.semester_id === semester.id);
                if (subjects.length === 0) return null;
                return (
                  <div key={semester.id} className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">{semester.name}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {subjects.map((subject) => (
                        <SubjectCard key={subject.id} subject={subject} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {unassigned.length ? (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Semestre à préciser</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {unassigned.map((subject) => (
                      <SubjectCard key={subject.id} subject={subject} />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}
