import Link from "next/link";
import type { Metadata } from "next";
import { History, Star, UserRound } from "lucide-react";
import { ProjectCard, ResourceCard } from "@/components/cards";
import { ProfileForm } from "@/components/profile-form";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getFavorites, getHistory } from "@/lib/queries";

export const metadata: Metadata = { title: "Mon espace" };

export default async function PersonalSpacePage() {
  const user = await requireUser("/espace");
  const [favorites, history] = await Promise.all([getFavorites(user.id), getHistory(user.id)]);

  return (
    <>
      <PageHeader title="Mon espace" description={`Connecté en tant que ${user.email ?? "utilisateur"}.`} />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="favoris-title">
            <h2 id="favoris-title" className="section-title flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" aria-hidden="true" /> Mes favoris
            </h2>
            {favorites.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={Star}
                title="Aucun favori"
                description="Utilisez le bouton « Ajouter aux favoris » sur un document ou un projet pour le retrouver ici."
              />
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {favorites.map((favorite) =>
                  favorite.resource ? (
                    <ResourceCard key={favorite.id} resource={favorite.resource} />
                  ) : favorite.project ? (
                    <ProjectCard key={favorite.id} project={favorite.project} />
                  ) : null,
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="historique-title">
            <h2 id="historique-title" className="section-title flex items-center gap-2">
              <History className="h-5 w-5 text-brand-600" aria-hidden="true" /> Historique de consultation
            </h2>
            {history.length === 0 ? (
              <EmptyState className="mt-4" icon={History} title="Aucune consultation enregistrée" description="Les documents et projets que vous consultez apparaîtront ici." />
            ) : (
              <ul className="card mt-4 divide-y divide-slate-100">
                {history.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    {event.resource ? (
                      <Link href={`/ressources/${event.resource.id}`} className="min-w-0 font-medium text-slate-800 hover:text-brand-700">
                        {event.resource.title}
                        <span className="ml-2 align-middle">
                          <Badge>{RESOURCE_TYPE_LABELS[event.resource.type]}</Badge>
                        </span>
                      </Link>
                    ) : event.project ? (
                      <Link href={`/projets/${event.project.slug}`} className="min-w-0 font-medium text-slate-800 hover:text-brand-700">
                        {event.project.title}
                        <span className="ml-2 align-middle">
                          <Badge tone="accent">Projet</Badge>
                        </span>
                      </Link>
                    ) : null}
                    <span className="text-xs text-slate-500">
                      {event.kind === "download" ? "Téléchargé" : "Consulté"} le {formatDate(event.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <UserRound className="h-4 w-4" aria-hidden="true" /> Profil
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Rôle : {user.profile?.role === "admin" ? "Administrateur" : "Étudiant"}
            </p>
            <div className="mt-4">
              <ProfileForm fullName={user.profile?.full_name ?? ""} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
