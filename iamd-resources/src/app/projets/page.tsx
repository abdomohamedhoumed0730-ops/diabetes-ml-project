import Link from "next/link";
import type { Metadata } from "next";
import clsx from "clsx";
import { FolderKanban } from "lucide-react";
import { ProjectCard } from "@/components/cards";
import { Breadcrumbs, EmptyState, PageHeader } from "@/components/ui";
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS, type ProjectCategory } from "@/lib/constants";
import { getProjects } from "@/lib/queries";
import { firstParam } from "@/lib/validation";

export const metadata: Metadata = { title: "Projets" };

export default async function ProjectsPage({ searchParams }: PageProps<"/projets">) {
  const raw = firstParam((await searchParams).categorie);
  const category = PROJECT_CATEGORIES.includes(raw as ProjectCategory) ? (raw as ProjectCategory) : undefined;
  const projects = await getProjects({ category });

  return (
    <>
      <PageHeader
        title="Projets universitaires et pratiques"
        description="Objectifs, étapes de réalisation, technologies, jeux de données (lorsque leur partage est autorisé), code source et rapports."
      >
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Projets" }]} />
      </PageHeader>
      <div className="container-page py-8">
        <nav aria-label="Filtrer par catégorie" className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/projets"
            aria-current={!category ? "page" : undefined}
            className={clsx("rounded-full px-3 py-1.5 text-sm font-medium", !category ? "bg-brand-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
          >
            Toutes les catégories
          </Link>
          {PROJECT_CATEGORIES.map((value) => (
            <Link
              key={value}
              href={`/projets?categorie=${value}`}
              aria-current={category === value ? "page" : undefined}
              className={clsx(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                category === value ? "bg-brand-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {PROJECT_CATEGORY_LABELS[value]}
            </Link>
          ))}
        </nav>
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={category ? `Aucun projet dans la catégorie « ${PROJECT_CATEGORY_LABELS[category]} »` : "Aucun projet publié"}
            description="Les projets seront ajoutés par l'administrateur au fil de la formation."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
