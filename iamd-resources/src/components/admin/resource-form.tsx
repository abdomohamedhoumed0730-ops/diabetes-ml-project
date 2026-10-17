"use client";

import { startTransition, useActionState, useState } from "react";
import { FileUp, Link2, Loader2 } from "lucide-react";
import clsx from "clsx";
import { prepareUpload, saveResource } from "@/app/admin/_actions/resources";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/admin/fields";
import { FieldError, FormMessage } from "@/components/form-message";
import { Alert } from "@/components/ui";
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPES, STORAGE_BUCKET } from "@/lib/constants";
import { ACCEPT_ATTRIBUTE, checkFileMeta, formatBytes, FILE_RULES } from "@/lib/files";
import { createClient } from "@/lib/supabase/client";

type SubjectOption = { id: string; name: string; chapters: { id: string; title: string; position: number }[] };
type ProjectOption = { id: string; title: string };
type ExistingResource = {
  id: string;
  title: string;
  description: string | null;
  type: (typeof RESOURCE_TYPES)[number];
  subject_id: string | null;
  chapter_id: string | null;
  project_id: string | null;
  source: string;
  author: string | null;
  license: string | null;
  keywords: string[];
  external_url: string | null;
  file_name: string | null;
  file_size: number | null;
  is_published: boolean;
};

const ACCEPTED_SUMMARY = Array.from(new Set(Object.values(FILE_RULES).map((rule) => rule.label))).join(", ");

export function ResourceForm({
  resource,
  subjects,
  projects,
  defaultSubjectId,
  defaultProjectId,
}: {
  resource?: ExistingResource;
  subjects: SubjectOption[];
  projects: ProjectOption[];
  defaultSubjectId?: string;
  defaultProjectId?: string;
}) {
  const [state, formAction, saving] = useActionState(saveResource, null);
  const [mode, setMode] = useState<"file" | "link">(resource?.external_url ? "link" : "file");
  const [subjectId, setSubjectId] = useState(resource?.subject_id ?? defaultSubjectId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const chapters = subjects.find((subject) => subject.id === subjectId)?.chapters ?? [];
  const busy = uploading || saving;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const formData = new FormData(event.currentTarget);

    if (mode === "link") {
      formData.delete("file_path");
    } else {
      formData.set("external_url", "");
      if (file) {
        const check = checkFileMeta(file.name, file.size);
        if (!check.ok) {
          setLocalError(check.error);
          return;
        }
        setUploading(true);
        try {
          const ticket = await prepareUpload({ fileName: file.name, size: file.size });
          if (!ticket.ok) {
            setLocalError(ticket.message);
            return;
          }
          const supabase = createClient();
          // Le type MIME envoyé est celui du Blob : on impose celui déduit de l'extension
          // (les navigateurs donnent des types variables, voire vides, pour .ipynb, .csv, .py…).
          const body = new Blob([file], { type: ticket.contentType });
          const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .uploadToSignedUrl(ticket.path, ticket.token, body, { contentType: ticket.contentType });
          if (error) {
            setLocalError(`Le téléversement a échoué : ${error.message}`);
            return;
          }
          formData.set("file_path", ticket.path);
          formData.set("file_name", file.name);
        } catch {
          setLocalError("Le téléversement a échoué. Vérifiez votre connexion et réessayez.");
          return;
        } finally {
          setUploading(false);
        }
      } else if (!resource?.file_name) {
        setLocalError("Sélectionnez un fichier à téléverser, ou choisissez « Lien externe ».");
        return;
      }
    }

    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <FormMessage state={state} />
      {localError ? <Alert tone="error">{localError}</Alert> : null}
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-800">Informations</legend>
        <TextField name="title" label="Titre" required state={state} defaultValue={resource?.title} maxLength={200} />
        <TextAreaField name="description" label="Description" rows={3} state={state} defaultValue={resource?.description} maxLength={4000} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="type"
            label="Type de document"
            required
            state={state}
            defaultValue={resource?.type ?? ""}
            placeholder="Choisir…"
            options={RESOURCE_TYPES.map((type) => ({ value: type, label: RESOURCE_TYPE_LABELS[type] }))}
          />
          <TextField
            name="keywords"
            label="Mots-clés"
            state={state}
            defaultValue={resource?.keywords.join(", ")}
            hint="Séparés par des virgules (ex. : régression, sklearn)."
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-800">Rattachement</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            name="subject_id"
            label="Matière"
            state={state}
            value={subjectId}
            onChange={setSubjectId}
            placeholder="— Aucune —"
            options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
          />
          <SelectField
            key={subjectId}
            name="chapter_id"
            label="Chapitre"
            state={state}
            defaultValue={resource?.subject_id === subjectId ? resource?.chapter_id : ""}
            placeholder={chapters.length ? "— Aucun —" : "Aucun chapitre"}
            options={chapters.map((chapter) => ({ value: chapter.id, label: chapter.title }))}
          />
          <SelectField
            name="project_id"
            label="Projet"
            state={state}
            defaultValue={resource?.project_id ?? defaultProjectId ?? ""}
            placeholder="— Aucun —"
            options={projects.map((project) => ({ value: project.id, label: project.title }))}
          />
        </div>
        <p className="text-xs text-slate-500">Une ressource doit être rattachée à une matière et/ou à un projet.</p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-800">Contenu</legend>
        <div role="radiogroup" aria-label="Type de contenu" className="inline-flex rounded-lg border border-slate-300 p-1">
          {(
            [
              { value: "file", label: "Fichier", icon: FileUp },
              { value: "link", label: "Lien externe", icon: Link2 },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={mode === option.value}
              onClick={() => setMode(option.value)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                mode === option.value ? "bg-brand-800 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <option.icon className="h-4 w-4" aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </div>

        {mode === "file" ? (
          <div>
            <label htmlFor="file-input" className="label">
              Fichier {resource?.file_name ? "(laisser vide pour conserver le fichier actuel)" : <span className="text-red-600">*</span>}
            </label>
            {resource?.file_name ? (
              <p className="mb-2 text-sm text-slate-600">
                Fichier actuel : <strong>{resource.file_name}</strong> ({formatBytes(resource.file_size ?? 0)})
              </p>
            ) : null}
            <input
              id="file-input"
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              onChange={(event) => {
                setLocalError(null);
                const selected = event.target.files?.[0] ?? null;
                const check = selected ? checkFileMeta(selected.name, selected.size) : null;
                setFileError(check && !check.ok ? check.error : null);
                setFile(selected);
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-800 hover:file:bg-brand-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Formats acceptés : {ACCEPTED_SUMMARY}. Taille maximale : 50 Mo (5 Mo pour les images et scripts). Le contenu réel du fichier est
              vérifié après l&apos;envoi.
            </p>
            {fileError ? <p className="mt-1 text-xs text-red-700">{fileError}</p> : null}
            {file ? (
              <p className="mt-1 text-xs text-slate-600">
                Sélectionné : {file.name} ({formatBytes(file.size)})
              </p>
            ) : null}
            <FieldError state={state} name="file" />
          </div>
        ) : (
          <TextField
            name="external_url"
            label="Adresse du lien externe"
            type="url"
            required
            state={state}
            defaultValue={resource?.external_url}
            placeholder="https://…"
            hint="Privilégiez les sources fiables (sites officiels, universités, documentation)."
          />
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-800">Source et droits</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            name="source"
            label="Source"
            required
            state={state}
            defaultValue={resource?.source}
            maxLength={500}
            placeholder="ex. : Cours de M. X, Université de Djibouti"
          />
          <TextField name="author" label="Auteur(s)" state={state} defaultValue={resource?.author} maxLength={200} />
          <TextField name="license" label="Licence / autorisation" state={state} defaultValue={resource?.license} maxLength={200} placeholder="ex. : CC BY 4.0, accord de l'auteur" />
        </div>
        <CheckboxField
          name="rights_confirmed"
          label="Je confirme être autorisé à diffuser ce document (accord de l'auteur ou licence le permettant) *"
          state={state}
          defaultChecked={Boolean(resource)}
        />
        <CheckboxField
          name="is_published"
          label="Publier immédiatement"
          hint="Une ressource non publiée reste visible uniquement par les administrateurs."
          state={state}
          defaultChecked={resource?.is_published ?? false}
        />
      </fieldset>

      <button type="submit" className="btn-primary" disabled={busy || (mode === "file" && Boolean(fileError))}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {uploading ? "Téléversement du fichier…" : saving ? "Enregistrement…" : resource ? "Enregistrer les modifications" : "Enregistrer la ressource"}
      </button>
    </form>
  );
}
