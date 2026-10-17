import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilePlus2, FolderKanban, Info, Pencil, Target } from "lucide-react";
import { ProjectCard, ResourceCard } from "@/components/cards";
import { SubjectIcon } from "@/components/icons";
import { Alert, Badge, Breadcrumbs, EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { SUBJECT_SECTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getSubjectBySlug } from "@/lib/queries";

export async function generateMetadata({ params }: PageProps<"/matieres/[slug]">): Promise<Metadata> {
  const data = await getSubjectBySlug((await params).slug);
  return { title: data?.subject.name ?? "Matière", description: data?.subject.short_description ?? undefined };
}

export default async function SubjectPage({ params }: PageProps<"/matieres/[slug]">) {
  const [data, user] = await Promise.all([getSubjectBySlug((await params).slug), getCurrentUser()]);
  if (!data) notFound();
  const { subject, resources, projects } = data;
  const isAdmin = user?.profile?.role === "admin";

  const courseResources = resources.filter((resource) => resource.type === "cours");
  const unassignedCourses = courseResources.filter((resource) => !resource.chapter);
  const sections = SUBJECT_SECTIONS.filter((section) => section.type !== "cours").map((section) => ({
    ...section,
    items: resources.filter((resource) => resource.type === section.type),
  }));
  const toc = [
    { id: "presentation", label: "Présentation et objectifs" },
    { id: "chapitres", label: "Chapitres et supports" },
    ...sections.filter((section) => section.items.length > 0 || ["resume", "exercice", "tp", "examen"].includes(section.type)).map((section) => ({ id: `section-${section.type}`, label: section.title })),
    { id: "projets", label: "Projets" },
  ];

  return (
    <>
      <div className="border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Accueil", href: "/" },
              { label: "Matières", href: "/matieres" },
              { label: subject.name },
            ]}
          />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
                <SubjectIcon name={subject.icon} className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{subject.name}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {subject.level?.program ? <Badge tone="brand">{subject.level.program.short_name ?? subject.level.program.name}</Badge> : null}
                  {subject.level ? <Badge>{subject.level.name}</Badge> : null}
                  <Badge>{subject.semester?.name ?? "Semestre à préciser"}</Badge>
                  {!subject.is_published ? <Badge tone="amber">Non publiée</Badge> : null}
                </div>
              </div>
            </div>
            {isAdmin ? (
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/matieres/${subject.id}`} className="btn-secondary">
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Modifier
                </Link>
                <Link href={`/admin/ressources/nouvelle?matiere=${subject.id}`} className="btn-primary">
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Ajouter une ressource
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0 space-y-12">
          <section id="presentation" aria-labelledby="presentation-title" className="scroll-mt-24">
            <h2 id="presentation-title" className="section-title">
              Présentation et objectifs
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                  <Info className="h-4 w-4 text-brand-600" aria-hidden="true" /> Présentation
                </h3>
                <p className="prose-text mt-2 text-sm">
                  {subject.presentation ?? subject.short_description ?? "La présentation de ce cours n'a pas encore été rédigée."}
                </p>
              </div>
              <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                  <Target className="h-4 w-4 text-brand-600" aria-hidden="true" /> Objectifs
                </h3>
                <p className="prose-text mt-2 text-sm">{subject.objectives ?? "Les objectifs de ce cours n'ont pas encore été renseignés."}</p>
              </div>
            </div>
          </section>

          <section id="chapitres" aria-labelledby="chapitres-title" className="scroll-mt-24">
            <h2 id="chapitres-title" className="section-title">
              Chapitres et supports de cours
            </h2>
            {subject.chapters.length === 0 && courseResources.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="Aucun chapitre ni support de cours publié"
                description="Les chapitres et supports PDF seront ajoutés au fur et à mesure."
                action={isAdmin ? <Link href={`/admin/matieres/${subject.id}`} className="btn-primary">Ajouter des chapitres</Link> : null}
              />
            ) : (
              <ol className="mt-4 space-y-4">
                {subject.chapters.map((chapter, index) => {
                  const items = courseResources.filter((resource) => resource.chapter?.id === chapter.id);
                  return (
                    <li key={chapter.id} className="card p-5">
                      <h3 className="font-semibold text-brand-950">
                        <span className="mr-2 text-brand-500">Chapitre {index + 1}.</span>
                        {chapter.title}
                      </h3>
                      {chapter.description ? <p className="mt-1 text-sm text-slate-600">{chapter.description}</p> : null}
                      {items.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500 italic">Aucun support publié pour ce chapitre.</p>
                      ) : (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {items.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} showSubject={false} />
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
                {unassignedCourses.length ? (
                  <li className="card p-5">
                    <h3 className="font-semibold text-brand-950">Supports généraux</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {unassignedCourses.map((resource) => (
                        <ResourceCard key={resource.id} resource={resource} showSubject={false} />
                      ))}
                    </div>
                  </li>
                ) : null}
              </ol>
            )}
          </section>

          {sections.map((section) =>
            section.items.length === 0 && !["resume", "exercice", "tp", "examen"].includes(section.type) ? null : (
              <section key={section.type} id={`section-${section.type}`} aria-labelledby={`title-${section.type}`} className="scroll-mt-24">
                <h2 id={`title-${section.type}`} className="section-title">
                  {section.title}
                </h2>
                {section.items.length === 0 ? (
                  <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">{section.empty}</p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {section.items.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} showSubject={false} />
                    ))}
                  </div>
                )}
              </section>
            ),
          )}

          <section id="projets" aria-labelledby="projets-title" className="scroll-mt-24">
            <h2 id="projets-title" className="section-title">
              Projets
            </h2>
            {projects.length === 0 ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">Aucun projet rattaché à cette matière.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>

          {resources.length > 0 ? (
            <Alert tone="info">
              Chaque document indique sa source et sa date d&apos;ajout. Les supports externes restent la propriété de leurs auteurs.
            </Alert>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <nav aria-label="Sommaire de la matière" className="sticky top-24 space-y-1 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Sommaire</p>
            {toc.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="block rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-700">
                {item.label}
              </a>
            ))}
            <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <p className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5" aria-hidden="true" />
                {resources.length} ressource{resources.length > 1 ? "s" : ""}
              </p>
              <p className="mt-1">Mise à jour : {formatDate(subject.updated_at)}</p>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}
