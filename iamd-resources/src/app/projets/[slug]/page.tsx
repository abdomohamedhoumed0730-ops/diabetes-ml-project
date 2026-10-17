import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, GitBranch, Pencil, PlayCircle } from "lucide-react";
import { ResourceCard } from "@/components/cards";
import { FavoriteButton } from "@/components/favorite-button";
import { Badge, Breadcrumbs } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { DIFFICULTY_LABELS, PROJECT_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getFavoriteState, getProjectBySlug, getSignedFileUrl, logEvent } from "@/lib/queries";

export async function generateMetadata({ params }: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const data = await getProjectBySlug((await params).slug);
  return { title: data?.project.title ?? "Projet", description: data?.project.summary ?? undefined };
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-brand-950">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default async function ProjectPage({ params }: PageProps<"/projets/[slug]">) {
  const [data, user] = await Promise.all([getProjectBySlug((await params).slug), getCurrentUser()]);
  if (!data) notFound();
  const { project, resources } = data;
  const isAdmin = user?.profile?.role === "admin";

  const screenshots = resources.filter((resource) => resource.type === "capture" && resource.file_path);
  const reports = resources.filter((resource) => resource.type === "projet" && resource.file_name?.toLowerCase().endsWith(".pdf"));
  const datasets = resources.filter((resource) => resource.type === "dataset");
  const others = resources.filter((resource) => !screenshots.includes(resource) && !reports.includes(resource) && !datasets.includes(resource));

  const [screenshotUrls, isFavorite] = await Promise.all([
    Promise.all(screenshots.map(async (shot) => ({ ...shot, url: await getSignedFileUrl(shot.file_path!, { expiresIn: 3600 }) }))),
    getFavoriteState(user?.id, { projectId: project.id }),
    logEvent("view", { projectId: project.id }),
  ]);

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Projets", href: "/projets" }, { label: project.title }]} />

      {project.is_example ? (
        <div role="note" className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>Exemple fictif.</strong> Cette fiche illustre la présentation d&apos;un projet sur la plateforme. Elle ne correspond pas à
            un projet réalisé et ne contient ni rapport ni résultat expérimental.
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{PROJECT_CATEGORY_LABELS[project.category]}</Badge>
            <Badge>Niveau : {DIFFICULTY_LABELS[project.difficulty]}</Badge>
            {!project.is_published ? <Badge tone="amber">Brouillon</Badge> : null}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{project.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {project.subject ? (
              <>
                Matière :{" "}
                <Link href={`/matieres/${project.subject.slug}`} className="text-brand-700 hover:underline">
                  {project.subject.name}
                </Link>{" "}
                ·{" "}
              </>
            ) : null}
            Ajouté le {formatDate(project.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FavoriteButton active={isFavorite} projectId={project.id} path={`/projets/${project.slug}`} />
          {isAdmin ? (
            <Link href={`/admin/projets/${project.id}`} className="btn-secondary">
              <Pencil className="h-4 w-4" aria-hidden="true" /> Modifier
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-5">
          <Block title="Description">
            <p className="prose-text text-sm">{project.description ?? project.summary ?? "Description à venir."}</p>
          </Block>
          {project.objectives ? (
            <Block title="Objectifs">
              <p className="prose-text text-sm">{project.objectives}</p>
            </Block>
          ) : null}
          {project.steps.length ? (
            <Block title="Étapes de réalisation">
              <ol className="space-y-2 text-sm">
                {project.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </Block>
          ) : null}
          {screenshotUrls.length ? (
            <Block title="Captures d'écran">
              <div className="grid gap-3 sm:grid-cols-2">
                {screenshotUrls.map((shot) =>
                  shot.url ? (
                    <figure key={shot.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot.url} alt={shot.title} loading="lazy" className="rounded-lg border border-slate-200" />
                      <figcaption className="mt-1 text-xs text-slate-500">
                        {shot.title} — Source : {shot.source}
                      </figcaption>
                    </figure>
                  ) : null,
                )}
              </div>
            </Block>
          ) : null}
          <Block title="Rapport">
            {reports.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {reports.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} showSubject={false} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun rapport PDF disponible pour ce projet.</p>
            )}
          </Block>
          <Block title="Jeux de données">
            {datasets.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {datasets.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} showSubject={false} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Aucun jeu de données partagé (les données ne sont publiées que lorsque leur licence le permet).
              </p>
            )}
          </Block>
          {others.length ? (
            <Block title="Code source et autres fichiers">
              <div className="grid gap-3 sm:grid-cols-2">
                {others.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} showSubject={false} />
                ))}
              </div>
            </Block>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-4 p-5 text-sm">
            <div>
              <h2 className="font-semibold text-slate-800">Technologies</h2>
              {project.technologies.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <li key={tech} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {tech}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-slate-500">Non renseignées.</p>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Connaissances nécessaires</h2>
              <p className="prose-text mt-1">{project.prerequisites ?? "Non renseignées."}</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Difficulté</h2>
              <p className="mt-1 flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-accent-600" aria-hidden="true" />
                {DIFFICULTY_LABELS[project.difficulty]}
              </p>
            </div>
          </div>
          <div className="card space-y-2 p-5">
            <h2 className="text-sm font-semibold text-slate-800">Liens</h2>
            {project.repository_url ? (
              <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
                <GitBranch className="h-4 w-4" aria-hidden="true" /> Code source (dépôt)
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <p className="text-sm text-slate-500">Aucun dépôt de code associé.</p>
            )}
            {project.demo_url ? (
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
                <PlayCircle className="h-4 w-4" aria-hidden="true" /> Démonstration
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
