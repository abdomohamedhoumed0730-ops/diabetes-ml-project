import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { env } from "@/lib/env";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-brand-950 text-brand-100">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-lg font-semibold text-white">{SITE_NAME}</p>
          <p className="mt-2 max-w-md text-sm text-brand-200">
            Plateforme de ressources pédagogiques destinée aux étudiants du Master Intelligence Artificielle et Modélisation des Données
            (IAMD) de l&apos;Université de Djibouti. Les contenus sont publiés avec l&apos;accord de leurs auteurs ou sous licence libre.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Navigation</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/formations" className="hover:text-white hover:underline">Formations</Link></li>
            <li><Link href="/matieres" className="hover:text-white hover:underline">Matières</Link></li>
            <li><Link href="/projets" className="hover:text-white hover:underline">Projets</Link></li>
            <li><Link href="/recherche" className="hover:text-white hover:underline">Recherche</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Informations</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/mentions-legales" className="hover:text-white hover:underline">Mentions légales</Link></li>
            <li><Link href="/mentions-legales#droits-auteur" className="hover:text-white hover:underline">Droits d&apos;auteur et signalement</Link></li>
            {env.contactName ? <li className="pt-1 text-white">{env.contactName}</li> : null}
            {env.contactEmail ? (
              <li>
                <a href={`mailto:${env.contactEmail}`} className="inline-flex items-center gap-1.5 break-all hover:text-white hover:underline">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {env.contactEmail}
                </a>
              </li>
            ) : null}
            {env.contactPhone ? (
              <li>
                <a href={`tel:${env.contactPhone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-white hover:underline">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {env.contactPhone}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-900">
        <p className="container-page py-4 text-xs text-brand-300">
          © {year} {SITE_NAME}. Les documents restent la propriété de leurs auteurs respectifs.
        </p>
      </div>
    </footer>
  );
}
