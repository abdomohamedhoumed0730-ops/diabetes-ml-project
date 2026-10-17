import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, FileText, FolderKanban, SearchX, SlidersHorizontal } from "lucide-react";
import { Badge, Breadcrumbs, EmptyState, PageHeader } from "@/components/ui";
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS, RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getChaptersForSubject, getLevels, getSubjects, SEARCH_PAGE_SIZE, searchCatalog } from "@/lib/queries";
import { searchSchema, type SearchInput } from "@/lib/validation";

export const metadata: Metadata = { title: "Recherche" };

const KIND_LABELS = { resource: "Document", project: "Projet", subject: "Matière" } as const;

function buildHref(input: SearchInput, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...input, page: page > 1 ? page : undefined })) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return `/recherche?${params.toString()}`;
}

function resultHref(result: { kind: string; id: string; slug: string | null }) {
  if (result.kind === "resource") return `/ressources/${result.id}`;
  if (result.kind === "project") return `/projets/${result.slug}`;
  return `/matieres/${result.slug}`;
}

export default async function SearchPage({ searchParams }: PageProps<"/recherche">) {
  const raw = await searchParams;
  const input = searchSchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );

  const [levels, subjects, chapters, { results, total, page }] = await Promise.all([
    getLevels(),
    getSubjects(),
    input.subject ? getChaptersForSubject(input.subject) : Promise.resolve([]),
    searchCatalog(input),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  const hasCriteria = Object.entries(input).some(([key, value]) => key !== "page" && value !== undefined);

  return (
    <>
      <PageHeader title="Recherche" description="Recherchez par mot-clé, matière, niveau, type de document, chapitre ou type de projet.">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Recherche" }]} />
      </PageHeader>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[280px_1fr]">
        <form action="/recherche" method="get" className="card h-fit space-y-4 p-5" aria-label="Filtres de recherche">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtres
          </h2>
          <div>
            <label htmlFor="q" className="label">
              Mot-clé
            </label>
            <input id="q" name="q" type="search" defaultValue={input.q} maxLength={120} className="input" placeholder="ex. : régression, CNN, SQL…" />
          </div>
          <div>
            <label htmlFor="kind" className="label">
              Rechercher parmi
            </label>
            <select id="kind" name="kind" defaultValue={input.kind ?? ""} className="input">
              <option value="">Tout</option>
              <option value="resource">Documents</option>
              <option value="project">Projets</option>
              <option value="subject">Matières</option>
            </select>
          </div>
          <div>
            <label htmlFor="level" className="label">
              Niveau d&apos;étude
            </label>
            <select id="level" name="level" defaultValue={input.level ?? ""} className="input">
              <option value="">Tous les niveaux</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                  {level.program?.short_name ? ` (${level.program.short_name})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subject" className="label">
              Matière
            </label>
            <select id="subject" name="subject" defaultValue={input.subject ?? ""} className="input">
              <option value="">Toutes les matières</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          {chapters.length ? (
            <div>
              <label htmlFor="chapter" className="label">
                Chapitre
              </label>
              <select id="chapter" name="chapter" defaultValue={input.chapter ?? ""} className="input">
                <option value="">Tous les chapitres</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Choisissez une matière puis appliquez les filtres pour filtrer par chapitre.</p>
          )}
          <div>
            <label htmlFor="type" className="label">
              Type de document
            </label>
            <select id="type" name="type" defaultValue={input.type ?? ""} className="input">
              <option value="">Tous les types</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RESOURCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="label">
              Type de projet
            </label>
            <select id="category" name="category" defaultValue={input.category ?? ""} className="input">
              <option value="">Toutes les catégories</option>
              {PROJECT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {PROJECT_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              Appliquer
            </button>
            <Link href="/recherche" className="btn-secondary">
              Réinitialiser
            </Link>
          </div>
        </form>

        <section aria-labelledby="results-title" aria-live="polite">
          <h2 id="results-title" className="text-sm text-slate-600">
            {total === 0 ? "Aucun résultat" : `${total} résultat${total > 1 ? "s" : ""}`}
            {input.q ? (
              <>
                {" "}
                pour « <strong className="text-slate-900">{input.q}</strong> »
              </>
            ) : null}
          </h2>

          {results.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={SearchX}
              title={hasCriteria ? "Aucun résultat ne correspond à votre recherche" : "Aucun contenu publié pour le moment"}
              description={
                hasCriteria
                  ? "Essayez un mot-clé plus court, vérifiez l'orthographe ou retirez certains filtres."
                  : "Les documents et projets apparaîtront ici dès leur publication."
              }
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {results.map((result) => {
                const Icon = result.kind === "resource" ? FileText : result.kind === "project" ? FolderKanban : BookOpen;
                return (
                  <li key={`${result.kind}-${result.id}`}>
                    <Link href={resultHref(result)} className="card-hover flex gap-4 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone="brand">{KIND_LABELS[result.kind as keyof typeof KIND_LABELS]}</Badge>
                          {result.resource_type ? <Badge>{RESOURCE_TYPE_LABELS[result.resource_type]}</Badge> : null}
                          {result.project_category ? <Badge tone="accent">{PROJECT_CATEGORY_LABELS[result.project_category]}</Badge> : null}
                          {result.is_external ? <Badge>Lien externe</Badge> : null}
                        </div>
                        <p className="mt-1.5 font-medium text-slate-900">{result.title}</p>
                        {result.excerpt ? <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{result.excerpt}</p> : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            result.kind !== "subject" ? result.subject_name : null,
                            result.chapter_title,
                            result.level_name,
                            formatDate(result.created_at),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 ? (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link href={buildHref(input, page - 1)} className="btn-secondary">
                  Page précédente
                </Link>
              ) : (
                <span />
              )}
              <span className="text-slate-500">
                Page {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={buildHref(input, page + 1)} className="btn-secondary">
                  Page suivante
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      </div>
    </>
  );
}
