"use client";

import { useActionForm } from "@/components/use-action-form";
import { useState } from "react";
import { saveSubject } from "@/app/admin/_actions/catalog";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/admin/fields";
import { SUBJECT_ICONS } from "@/lib/constants";
import { slugify } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

type Level = { id: string; name: string; program: { short_name: string | null; name: string } | null; semesters: { id: string; name: string }[] };

export function SubjectForm({ subject, levels }: { subject?: Tables<"subjects">; levels: Level[] }) {
  const { state, pending, formProps } = useActionForm(saveSubject);
  const [levelId, setLevelId] = useState(subject?.level_id ?? levels[0]?.id ?? "");
  const [slug, setSlug] = useState(subject?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(subject));
  const semesters = levels.find((level) => level.id === levelId)?.semesters ?? [];

  return (
    <form {...formProps} className="space-y-5">
      <FormMessage state={state} />
      {subject ? <input type="hidden" name="id" value={subject.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="field-name" className="label">
            Nom de la matière <span className="text-red-600">*</span>
          </label>
          <input
            id="field-name"
            name="name"
            required
            maxLength={200}
            defaultValue={subject?.name}
            className="input"
            onChange={(event) => {
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
          />
          {state?.errors?.name ? <p className="mt-1 text-xs text-red-700">{state.errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="field-slug" className="label">
            Identifiant d&apos;URL <span className="text-red-600">*</span>
          </label>
          <input
            id="field-slug"
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className="input font-mono"
          />
          <p className="mt-1 text-xs text-slate-500">Adresse : /matieres/{slug || "…"}</p>
          {state?.errors?.slug ? <p className="mt-1 text-xs text-red-700">{state.errors.slug}</p> : null}
        </div>
        <SelectField
          name="level_id"
          label="Niveau"
          required
          state={state}
          value={levelId}
          onChange={setLevelId}
          options={levels.map((level) => ({ value: level.id, label: `${level.name}${level.program ? ` — ${level.program.short_name ?? level.program.name}` : ""}` }))}
        />
        <SelectField
          key={levelId}
          name="semester_id"
          label="Semestre"
          state={state}
          defaultValue={subject?.level_id === levelId ? subject?.semester_id : ""}
          placeholder="À préciser"
          options={semesters.map((semester) => ({ value: semester.id, label: semester.name }))}
        />
        <SelectField
          name="icon"
          label="Icône"
          state={state}
          defaultValue={subject?.icon ?? "book-open"}
          options={SUBJECT_ICONS.map((icon) => ({ value: icon, label: icon }))}
        />
        <TextField name="sort_order" label="Ordre d'affichage" type="number" state={state} defaultValue={subject?.sort_order ?? 0} />
      </div>
      <TextField name="short_description" label="Description courte (cartes)" maxLength={300} state={state} defaultValue={subject?.short_description} />
      <TextAreaField name="presentation" label="Présentation du cours" rows={5} maxLength={10000} state={state} defaultValue={subject?.presentation} />
      <TextAreaField name="objectives" label="Objectifs du cours" rows={5} maxLength={10000} state={state} defaultValue={subject?.objectives} hint="Un objectif par ligne." />
      <CheckboxField name="is_published" label="Matière publiée (visible publiquement)" state={state} defaultChecked={subject?.is_published ?? true} />
      <SubmitButton pending={pending}>{subject ? "Enregistrer les modifications" : "Créer la matière"}</SubmitButton>
    </form>
  );
}
