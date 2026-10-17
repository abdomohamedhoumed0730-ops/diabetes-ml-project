"use client";

import { useActionForm } from "@/components/use-action-form";
import { deleteCatalogItem, saveLevel, saveProgram, saveSemester } from "@/app/admin/_actions/catalog";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/fields";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { Tables } from "@/lib/database.types";

export function ProgramForm({ program }: { program?: Tables<"programs"> }) {
  const { state, pending, formProps } = useActionForm(saveProgram, { resetOnSuccess: !program });
  return (
    <form {...formProps} className="space-y-3" key={program?.updated_at}>
      <FormMessage state={state} />
      {program ? <input type="hidden" name="id" value={program.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="name" label="Nom" required state={state} defaultValue={program?.name} maxLength={200} />
        <TextField name="slug" label="Identifiant d'URL" required state={state} defaultValue={program?.slug} placeholder="master-iamd" />
        <TextField name="short_name" label="Sigle" state={state} defaultValue={program?.short_name} maxLength={40} />
        <TextField name="institution" label="Établissement" state={state} defaultValue={program?.institution} maxLength={200} />
        <TextField name="sort_order" label="Ordre" type="number" state={state} defaultValue={program?.sort_order ?? 0} />
      </div>
      <TextAreaField name="description" label="Description" rows={3} state={state} defaultValue={program?.description} maxLength={4000} />
      <CheckboxField name="is_published" label="Formation publiée" state={state} defaultChecked={program?.is_published ?? true} />
      <div className="flex flex-wrap items-start gap-2">
        <SubmitButton pending={pending}>{program ? "Enregistrer" : "Créer la formation"}</SubmitButton>
        {program ? (
          <DeleteButton
            action={deleteCatalogItem}
            fields={{ table: "programs", id: program.id }}
            confirmMessage={`Supprimer la formation « ${program.name} » ? Ses niveaux et semestres seront supprimés. La suppression est refusée si des matières y sont rattachées.`}
          />
        ) : null}
      </div>
    </form>
  );
}

export function LevelRow({ level, programId }: { level: { id: string; name: string; sort_order: number }; programId: string }) {
  const { state, pending, formProps } = useActionForm(saveLevel);
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <form {...formProps} className="flex flex-1 flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={level.id} />
          <input type="hidden" name="program_id" value={programId} />
          <label className="sr-only" htmlFor={`level-name-${level.id}`}>Nom du niveau</label>
          <input id={`level-name-${level.id}`} name="name" defaultValue={level.name} required maxLength={100} className="input max-w-56" />
          <label className="sr-only" htmlFor={`level-order-${level.id}`}>Ordre</label>
          <input id={`level-order-${level.id}`} name="sort_order" type="number" defaultValue={level.sort_order} className="input w-20" />
          <SubmitButton pending={pending} className="btn-secondary" pendingLabel="…">Enregistrer</SubmitButton>
        </form>
        <DeleteButton
          action={deleteCatalogItem}
          fields={{ table: "levels", id: level.id }}
          confirmMessage={`Supprimer le niveau « ${level.name} » ? La suppression est refusée si des matières y sont rattachées.`}
          label="Supprimer le niveau"
          compact
        />
      </div>
      <FormMessage state={state} />
    </div>
  );
}

export function SemesterRow({ semester, levelId }: { semester: { id: string; name: string; sort_order: number }; levelId: string }) {
  const { state, pending, formProps } = useActionForm(saveSemester);
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <form {...formProps} className="flex flex-1 flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={semester.id} />
          <input type="hidden" name="level_id" value={levelId} />
          <label className="sr-only" htmlFor={`sem-name-${semester.id}`}>Nom du semestre</label>
          <input id={`sem-name-${semester.id}`} name="name" defaultValue={semester.name} required maxLength={100} className="input max-w-56" />
          <label className="sr-only" htmlFor={`sem-order-${semester.id}`}>Ordre</label>
          <input id={`sem-order-${semester.id}`} name="sort_order" type="number" defaultValue={semester.sort_order} className="input w-20" />
          <SubmitButton pending={pending} className="btn-secondary" pendingLabel="…">Enregistrer</SubmitButton>
        </form>
        <DeleteButton
          action={deleteCatalogItem}
          fields={{ table: "semesters", id: semester.id }}
          confirmMessage={`Supprimer « ${semester.name} » ? Les matières concernées passeront en « semestre à préciser ».`}
          label="Supprimer le semestre"
          compact
        />
      </div>
      <FormMessage state={state} />
    </div>
  );
}

export function AddLevelForm({ programId }: { programId: string }) {
  const { state, pending, formProps } = useActionForm(saveLevel, { resetOnSuccess: true });
  return (
    <form {...formProps} className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="program_id" value={programId} />
        <label className="sr-only" htmlFor={`new-level-${programId}`}>Nouveau niveau</label>
        <input id={`new-level-${programId}`} name="name" required maxLength={100} placeholder="Nouveau niveau (ex. : Licence 3)" className="input max-w-64" />
        <input type="hidden" name="sort_order" value="0" />
        <SubmitButton pending={pending} className="btn-secondary" pendingLabel="…">Ajouter le niveau</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function AddSemesterForm({ levelId }: { levelId: string }) {
  const { state, pending, formProps } = useActionForm(saveSemester, { resetOnSuccess: true });
  return (
    <form {...formProps} className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="level_id" value={levelId} />
        <label className="sr-only" htmlFor={`new-sem-${levelId}`}>Nouveau semestre</label>
        <input id={`new-sem-${levelId}`} name="name" required maxLength={100} placeholder="Nouveau semestre" className="input max-w-56" />
        <input type="hidden" name="sort_order" value="0" />
        <SubmitButton pending={pending} className="btn-secondary" pendingLabel="…">Ajouter</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
