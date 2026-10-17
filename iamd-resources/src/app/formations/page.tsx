import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { Breadcrumbs, EmptyState, PageHeader } from "@/components/ui";
import { getPrograms } from "@/lib/queries";

export const metadata: Metadata = { title: "Formations" };

export default async function FormationsPage() {
  const programs = await getPrograms();
  return (
    <>
      <PageHeader title="Formations" description="Choisissez une formation pour parcourir ses niveaux, semestres et matières.">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Formations" }]} />
      </PageHeader>
      <div className="container-page py-10">
        {programs.length === 0 ? (
          <EmptyState title="Aucune formation publiée" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {programs.map((program) => (
              <Link key={program.id} href={`/formations/${program.slug}`} className="card-hover group p-6">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-brand-700" aria-hidden="true" />
                  <h2 className="font-semibold text-brand-950 group-hover:text-brand-700">{program.name}</h2>
                </div>
                {program.institution ? <p className="mt-1 text-sm text-slate-500">{program.institution}</p> : null}
                {program.description ? <p className="mt-3 text-sm text-slate-600">{program.description}</p> : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
