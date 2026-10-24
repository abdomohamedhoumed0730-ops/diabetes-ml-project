import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/ui";
import { SITE_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalPage() {
  const details = [
    env.contactName,
    env.contactEmail,
    env.contactPhone,
  ].filter(Boolean);
  const contact = details.length ? (
    <strong className="font-medium text-slate-900">{details.join(" · ")}</strong>
  ) : (
    <em>coordonnées à renseigner par l&apos;éditeur du site</em>
  );

  return (
    <>
      <PageHeader title="Mentions légales">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Mentions légales" }]} />
      </PageHeader>
      <div className="container-page max-w-3xl space-y-8 py-10 text-slate-700">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ce texte est un modèle à compléter par l&apos;éditeur du site (identité, hébergeur, adresse) et à faire valider si nécessaire.
        </p>
        <section>
          <h2 className="section-title">Éditeur</h2>
          <p className="mt-2">
            {SITE_NAME} est une plateforme de partage de ressources pédagogiques destinée aux étudiants du Master Intelligence Artificielle
            et Modélisation des Données (IAMD). Sauf mention contraire, il ne s&apos;agit pas d&apos;un site officiel de l&apos;Université de
            Djibouti. Contact : {contact}.
          </p>
        </section>
        <section>
          <h2 className="section-title">Hébergement</h2>
          <p className="mt-2">
            Application hébergée par le prestataire choisi par l&apos;éditeur (par exemple Vercel Inc.) ; base de données et fichiers
            hébergés par Supabase. Les coordonnées exactes de l&apos;hébergeur doivent être indiquées ici lors de la mise en ligne.
          </p>
        </section>
        <section id="droits-auteur" className="scroll-mt-24">
          <h2 className="section-title">Droits d&apos;auteur</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Seuls sont publiés les documents que l&apos;éditeur est autorisé à diffuser (accord de l&apos;auteur ou licence libre).</li>
            <li>Chaque document indique sa source, et lorsque c&apos;est possible son auteur et sa licence.</li>
            <li>Les supports externes sont proposés sous forme de liens vers leur site d&apos;origine.</li>
            <li>
              Si vous êtes l&apos;auteur d&apos;un document et souhaitez son retrait ou une correction, écrivez à {contact} : le document sera
              dépublié dans les meilleurs délais.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="section-title">Données personnelles</h2>
          <p className="mt-2">
            La consultation est possible sans compte. En cas de création de compte, sont conservés : l&apos;adresse e-mail, le nom saisi, les
            favoris et l&apos;historique des consultations, uniquement pour fournir ces fonctionnalités. Les statistiques de consultation et de
            téléchargement sont agrégées pour l&apos;administration du site. Pour toute demande d&apos;accès ou de suppression : {contact}.
          </p>
        </section>
        <section>
          <h2 className="section-title">Cookies</h2>
          <p className="mt-2">Seuls des cookies techniques nécessaires à la connexion sont utilisés. Aucun cookie publicitaire n&apos;est déposé.</p>
        </section>
      </div>
    </>
  );
}
