import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { env } from "@/lib/env";
import portrait from "@/assets/responsable.jpg";

const OWNER_NAME = "Abdo Mohamed Houmed";

/** Présentation du responsable de la plateforme, en bas de la page d'accueil. */
export function PlatformOwner() {
  const name = env.contactName || OWNER_NAME;
  return (
    <section aria-labelledby="responsable-title" className="card overflow-hidden">
      <div className="grid gap-6 p-6 sm:grid-cols-[180px_1fr] sm:items-center sm:p-8">
        <Image
          src={portrait}
          alt={`Portrait de ${name}`}
          sizes="180px"
          placeholder="blur"
          className="mx-auto h-auto w-40 rounded-xl border border-slate-200 sm:w-full"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-accent-700 uppercase">Responsable de la plateforme</p>
          <h2 id="responsable-title" className="mt-1 text-xl font-semibold text-brand-950 sm:text-2xl">
            {name}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            IAMD Resources est conçue et administrée pour faciliter l&apos;accès des étudiants du Master IAMD à leurs supports de cours,
            exercices, travaux pratiques et projets. Pour proposer un document, signaler une erreur ou une question de droits d&apos;auteur :
          </p>
          {env.contactEmail || env.contactPhone ? (
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {env.contactEmail ? (
                <li>
                  <a href={`mailto:${env.contactEmail}`} className="btn-secondary break-all">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {env.contactEmail}
                  </a>
                </li>
              ) : null}
              {env.contactPhone ? (
                <li>
                  <a href={`tel:${env.contactPhone.replace(/[^+\d]/g, "")}`} className="btn-secondary">
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {env.contactPhone}
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
