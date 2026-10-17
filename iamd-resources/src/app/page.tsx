import Link from "next/link";
import { ArrowRight, BookOpenCheck, FolderKanban, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { ProjectCard, ResourceCard, SubjectCard } from "@/components/cards";
import { Alert, EmptyState, SectionHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getLatestResources, getPopularResources, getPrograms, getProjects, getSubjects } from "@/lib/queries";
import { firstParam } from "@/lib/validation";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const [programs, subjects, latest, popular, projects, user] = await Promise.all([
    getPrograms(),
    getSubjects(),
    getLatestResources(6),
    getPopularResources(6),
    getProjects({ limit: 3 }),
    getCurrentUser(),
  ]);
  const isAdmin = user?.profile?.role === "admin";
  const accessDenied = firstParam(params.erreur) === "acces-refuse";

  return (
    <>
      {/* Bandeau principal */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,#3461ab_0,transparent_45%),radial-gradient(circle_at_85%_60%,#0e8673_0,transparent_40%)]"
        />
        <div className="container-page relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 ring-1 ring-white/15">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Master Intelligence Artificielle et Modélisation des Données
          </p>
          <h1 className="animate-fade-in mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            Toutes vos ressources universitaires au même endroit
          </h1>
          <p className="mt-4 max-w-2xl text-base text-brand-100 sm:text-lg">
            Cours, résumés, exercices corrigés, travaux pratiques, projets et sujets d&apos;examens, organisés par formation, niveau,
            semestre et matière. Consultation libre, sans création de compte.
          </p>
          <div className="mt-8 max-w-2xl">
            <SearchBar size="lg" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/matieres" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 font-medium text-brand-900 hover:bg-brand-50">
              <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              Parcourir les matières
            </Link>
            <Link href="/projets" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium text-white ring-1 ring-white/30 hover:bg-white/10">
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              Voir les projets
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 py-12">
        {accessDenied ? <Alert tone="error">Accès refusé : cette section est réservée aux administrateurs.</Alert> : null}

        {/* Formations */}
        <section aria-labelledby="formations-title">
          <SectionHeader
            id="formations-title"
            title="Formations"
            description="La plateforme est conçue pour accueillir d'autres formations à l'avenir."
          />
          {programs.length === 0 ? (
            <EmptyState title="Aucune formation publiée" description="Les formations apparaîtront ici dès leur création par l'administrateur." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {programs.map((program) => (
                <Link key={program.id} href={`/formations/${program.slug}`} className="card-hover group flex flex-col p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-800 text-white">
                      <GraduationCap className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-brand-950 group-hover:text-brand-700">{program.name}</h3>
                      {program.institution ? <p className="text-sm text-slate-500">{program.institution}</p> : null}
                    </div>
                  </div>
                  {program.description ? <p className="mt-3 text-sm text-slate-600">{program.description}</p> : null}
                  <p className="mt-4 text-sm text-slate-500">
                    Niveaux : {program.levels.map((level) => level.name).join(", ") || "à définir"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Matières */}
        <section aria-labelledby="matieres-title">
          <SectionHeader
            id="matieres-title"
            title="Matières"
            description="Catégories de départ, à ajuster selon le programme officiel de la formation."
            action={
              <Link href="/matieres" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                Toutes les matières <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          {subjects.length === 0 ? (
            <EmptyState title="Aucune matière publiée" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.slice(0, 9).map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          )}
        </section>

        {/* Dernières ressources */}
        <section aria-labelledby="dernieres-title">
          <SectionHeader
            id="dernieres-title"
            title="Dernières ressources ajoutées"
            action={
              <Link href="/recherche?kind=resource" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                Tout voir <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          {latest.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Aucun document n'a encore été publié"
              description="Les supports de cours, exercices et TP apparaîtront ici dès leur publication."
              action={
                isAdmin ? (
                  <Link href="/admin/ressources/nouvelle" className="btn-primary">
                    Ajouter un document
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </section>

        {/* Projets */}
        <section aria-labelledby="projets-title">
          <SectionHeader
            id="projets-title"
            title="Projets pratiques"
            description="Projets universitaires et pratiques : objectifs, étapes, technologies et fichiers associés."
            action={
              <Link href="/projets" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                Tous les projets <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="Aucun projet publié pour le moment" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>

        {/* Ressources populaires */}
        <section aria-labelledby="populaires-title">
          <SectionHeader
            id="populaires-title"
            title="Ressources populaires"
            description="Classement fondé sur les consultations et téléchargements réels enregistrés sur la plateforme."
          />
          {popular.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Pas encore de statistiques"
              description="Les ressources les plus consultées et téléchargées s'afficheront ici."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
