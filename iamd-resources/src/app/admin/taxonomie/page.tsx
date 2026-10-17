import { AddLevelForm, AddSemesterForm, LevelRow, ProgramForm, SemesterRow } from "@/components/admin/taxonomy-forms";
import { getAdminTaxonomy } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";

export const metadata = { title: "Formations et niveaux" };

export default async function TaxonomyPage() {
  await requireAdminPage();
  const programs = await getAdminTaxonomy();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-950">Formations, niveaux et semestres</h1>
        <p className="text-sm text-slate-500">
          Structure de la plateforme : une formation contient des niveaux, qui contiennent des semestres. D&apos;autres formations peuvent être
          ajoutées à tout moment.
        </p>
      </div>

      {programs.map((program) => (
        <section key={program.id} className="card space-y-6 p-6" aria-label={program.name}>
          <ProgramForm program={program} />
          <div className="space-y-4 border-t border-slate-200 pt-5">
            <h3 className="font-semibold text-slate-800">Niveaux et semestres</h3>
            {program.levels.map((level) => (
              <div key={level.id} className="space-y-3 rounded-lg border border-slate-200 p-4">
                <LevelRow level={level} programId={program.id} />
                <div className="space-y-2 border-l-2 border-brand-100 pl-4">
                  {level.semesters.map((semester) => (
                    <SemesterRow key={semester.id} semester={semester} levelId={level.id} />
                  ))}
                  <AddSemesterForm levelId={level.id} />
                </div>
              </div>
            ))}
            <AddLevelForm programId={program.id} />
          </div>
        </section>
      ))}

      <section className="card p-6" aria-labelledby="new-program">
        <h2 id="new-program" className="mb-4 font-semibold text-slate-800">
          Nouvelle formation
        </h2>
        <ProgramForm />
      </section>
    </div>
  );
}
