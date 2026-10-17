import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, ExternalLink, Pencil } from "lucide-react";
import { z } from "zod";
import { FavoriteButton } from "@/components/favorite-button";
import { FilePreview } from "@/components/file-preview";
import { FileIcon } from "@/components/icons";
import { Alert, Badge, Breadcrumbs } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatBytes, getFileRule } from "@/lib/files";
import { formatDate } from "@/lib/format";
import { getFavoriteState, getResource, getSignedFileUrl, logEvent } from "@/lib/queries";

async function load(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  return getResource(id);
}

export async function generateMetadata({ params }: PageProps<"/ressources/[id]">): Promise<Metadata> {
  const resource = await load((await params).id);
  return { title: resource?.title ?? "Document", description: resource?.description ?? undefined };
}

export default async function ResourcePage({ params }: PageProps<"/ressources/[id]">) {
  const { id } = await params;
  const [resource, user] = await Promise.all([load(id), getCurrentUser()]);
  if (!resource) notFound();

  const rule = resource.file_name ? getFileRule(resource.file_name) : null;
  const [previewUrl, isFavorite] = await Promise.all([
    rule?.preview && resource.file_path ? getSignedFileUrl(resource.file_path, { expiresIn: 3600 }) : Promise.resolve(null),
    getFavoriteState(user?.id, { resourceId: resource.id }),
    logEvent("view", { resourceId: resource.id }),
  ]);
  const isAdmin = user?.profile?.role === "admin";
  const path = `/ressources/${resource.id}`;

  const crumbs = [{ label: "Accueil", href: "/" }];
  if (resource.subject) crumbs.push({ label: resource.subject.name, href: `/matieres/${resource.subject.slug}` });
  else if (resource.project) crumbs.push({ label: resource.project.title, href: `/projets/${resource.project.slug}` });

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Type", value: RESOURCE_TYPE_LABELS[resource.type] },
    {
      label: "Matière",
      value: resource.subject ? (
        <Link href={`/matieres/${resource.subject.slug}`} className="text-brand-700 hover:underline">
          {resource.subject.name}
        </Link>
      ) : (
        "—"
      ),
    },
  ];
  if (resource.chapter) details.push({ label: "Chapitre", value: resource.chapter.title });
  if (resource.project)
    details.push({
      label: "Projet",
      value: (
        <Link href={`/projets/${resource.project.slug}`} className="text-brand-700 hover:underline">
          {resource.project.title}
        </Link>
      ),
    });
  details.push({ label: "Ajouté le", value: formatDate(resource.created_at) });
  if (resource.updated_at !== resource.created_at) details.push({ label: "Mis à jour le", value: formatDate(resource.updated_at) });
  details.push({ label: "Source", value: resource.source });
  if (resource.author) details.push({ label: "Auteur(s)", value: resource.author });
  if (resource.license) details.push({ label: "Licence / droits", value: resource.license });
  if (resource.file_name)
    details.push({ label: "Fichier", value: `${resource.file_name} · ${rule?.label ?? "Fichier"} · ${formatBytes(resource.file_size ?? 0)}` });
  if (resource.external_url) details.push({ label: "Lien", value: new URL(resource.external_url).hostname });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[...crumbs, { label: resource.title }]} />

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <FileIcon fileName={resource.file_name} external={Boolean(resource.external_url)} className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge tone="brand">{RESOURCE_TYPE_LABELS[resource.type]}</Badge>
                {!resource.is_published ? <Badge tone="amber">Brouillon (visible par les administrateurs uniquement)</Badge> : null}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{resource.title}</h1>
            </div>
          </div>

          {resource.description ? <p className="prose-text">{resource.description}</p> : null}

          {resource.keywords.length ? (
            <ul className="flex flex-wrap gap-2" aria-label="Mots-clés">
              {resource.keywords.map((keyword) => (
                <li key={keyword}>
                  <Link href={`/recherche?q=${encodeURIComponent(keyword)}`} className="badge bg-slate-100 text-slate-600 hover:bg-slate-200">
                    #{keyword}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {previewUrl && rule?.preview ? (
            <FilePreview url={previewUrl} kind={rule.preview} title={resource.title} />
          ) : resource.file_path ? (
            <Alert tone="info">L&apos;aperçu n&apos;est pas disponible pour ce format. Téléchargez le fichier pour l&apos;ouvrir.</Alert>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-3 p-5">
            <a href={`/api/ressources/${resource.id}/fichier`} className="btn-primary w-full" {...(resource.external_url ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {resource.external_url ? <ExternalLink className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {resource.external_url ? "Ouvrir la ressource externe" : "Télécharger"}
            </a>
            <FavoriteButton active={isFavorite} resourceId={resource.id} path={path} />
            {isAdmin ? (
              <Link href={`/admin/ressources/${resource.id}`} className="btn-secondary w-full">
                <Pencil className="h-4 w-4" aria-hidden="true" /> Modifier
              </Link>
            ) : null}
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-800">Informations</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className="break-words text-slate-800">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="text-xs text-slate-500">
            Un problème de droits d&apos;auteur avec ce document ?{" "}
            <Link href="/mentions-legales#droits-auteur" className="text-brand-700 hover:underline">
              Signalez-le
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
