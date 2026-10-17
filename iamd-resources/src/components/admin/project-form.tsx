"use client";

import { useActionForm } from "@/components/use-action-form";
import { useState } from "react";
import { saveProject } from "@/app/admin/_actions/projects";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/admin/fields";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { DIFFICULTIES, DIFFICULTY_LABELS, PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS } from "@/lib/constants";
import type { Tables } from "@/lib/database.types";
import { slugify } from "@/lib/format";

export function ProjectForm({ project, subjects }: { project?: Tables<"projects">; subjects: { id: string; name: string }[] }) {
  const { state, pending, formProps } = useActionForm(saveProject);
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));

  return (
    <form {...formProps} className="space-y-6">
      <FormMessage state={state} />
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-800">Présentation</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="field-title" className="label">
              Titre <span className="text-red-600">*</span>
            </label>
            <input
              id="field-title"
              name="title"
              required
              maxLength={200}
              defaultValue={project?.title}
              className="input"
              onChange={(event) => {
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
            />
            {state?.errors?.title ? <p className="mt-1 text-xs text-red-700">{state.errors.title}</p> : null}
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
            {state?.errors?.slug ? <p className="mt-1 text-xs text-red-700">{state.errors.slug}</p> : null}
          </div>
          <SelectField
            name="category"
            label="Catégorie"
            required
            state={state}
            defaultValue={project?.category ?? ""}
            placeholder="Choisir…"
            options={PROJECT_CATEGORIES.map((value) => ({ value, label: PROJECT_CATEGORY_LABELS[value] }))}
          />
          <SelectField
            name="difficulty"
            label="Niveau de difficulté"
            state={state}
            defaultValue={project?.difficulty ?? "intermediaire"}
            options={DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] }))}
          />
          <SelectField
            name="subject_id"
            label="Matière associée"
            state={state}
            defaultValue={project?.subject_id ?? ""}
            placeholder="— Aucune —"
            options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
          />
        </div>
        <TextField name="summary" label="Résumé (cartes)" maxLength={300} state={state} defaultValue={project?.summary} />
        <TextAreaField name="description" label="Description" rows={5} maxLength={10000} state={state} defaultValue={project?.description} />
        <TextAreaField name="objectives" label="Objectifs" rows={3} maxLength={5000} state={state} defaultValue={project?.objectives} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-800">Réalisation</legend>
        <TextField
          name="technologies"
          label="Technologies utilisées"
          state={state}
          defaultValue={project?.technologies.join(", ")}
          hint="Séparées par des virgules (ex. : Python, PyTorch, Docker)."
        />
        <TextAreaField
          name="steps"
          label="Étapes de réalisation"
          rows={6}
          state={state}
          defaultValue={project?.steps.join("\n")}
          hint="Une étape par ligne."
        />
        <TextAreaField name="prerequisites" label="Connaissances nécessaires" rows={3} maxLength={5000} state={state} defaultValue={project?.prerequisites} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="repository_url" label="Dépôt du code source (GitHub…)" type="url" state={state} defaultValue={project?.repository_url} placeholder="https://github.com/…" />
          <TextField name="demo_url" label="Démonstration" type="url" state={state} defaultValue={project?.demo_url} placeholder="https://…" />
        </div>
        <p className="text-xs text-slate-500">
          Le rapport PDF, les jeux de données, le code (ZIP, notebooks) et les captures d&apos;écran s&apos;ajoutent comme ressources rattachées au
          projet, après sa création.
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-800">Publication</legend>
        <CheckboxField
          name="is_example"
          label="Exemple fictif"
          hint="Affiche un avertissement indiquant qu'il ne s'agit pas d'un projet réel."
          state={state}
          defaultChecked={project?.is_example ?? false}
        />
        <CheckboxField name="is_published" label="Projet publié" state={state} defaultChecked={project?.is_published ?? false} />
      </fieldset>

      <SubmitButton pending={pending}>{project ? "Enregistrer les modifications" : "Créer le projet"}</SubmitButton>
    </form>
  );
}
