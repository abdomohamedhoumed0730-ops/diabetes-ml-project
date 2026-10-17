"use client";

import { useActionForm } from "@/components/use-action-form";
import { deleteCatalogItem, saveChapter } from "@/app/admin/_actions/catalog";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

type Chapter = { id: string; title: string; description: string | null; position: number };

function ChapterRow({ chapter, subjectId }: { chapter: Chapter; subjectId: string }) {
  const { state, pending, formProps } = useActionForm(saveChapter);
  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <form {...formProps} className="grid gap-2 sm:grid-cols-[70px_1fr_auto] sm:items-start">
        <input type="hidden" name="id" value={chapter.id} />
        <input type="hidden" name="subject_id" value={subjectId} />
        <label className="sr-only" htmlFor={`pos-${chapter.id}`}>Position</label>
        <input id={`pos-${chapter.id}`} name="position" type="number" min={0} defaultValue={chapter.position} className="input" />
        <div className="space-y-2">
          <label className="sr-only" htmlFor={`title-${chapter.id}`}>Titre</label>
          <input id={`title-${chapter.id}`} name="title" defaultValue={chapter.title} required maxLength={200} className="input" />
          <label className="sr-only" htmlFor={`desc-${chapter.id}`}>Description</label>
          <input id={`desc-${chapter.id}`} name="description" defaultValue={chapter.description ?? ""} placeholder="Description (facultatif)" maxLength={2000} className="input" />
        </div>
        <SubmitButton pending={pending} className="btn-secondary" pendingLabel="…">
          Enregistrer
        </SubmitButton>
      </form>
      <div className="mt-2 flex items-center justify-between gap-2">
        <FormMessage state={state} />
        <DeleteButton
          action={deleteCatalogItem}
          fields={{ table: "chapters", id: chapter.id }}
          confirmMessage={`Supprimer le chapitre « ${chapter.title} » ? Les documents rattachés resteront dans la matière, sans chapitre.`}
          label="Supprimer le chapitre"
          compact
        />
      </div>
    </li>
  );
}

export function ChapterManager({ subjectId, chapters }: { subjectId: string; chapters: Chapter[] }) {
  const { state, pending, formProps } = useActionForm(saveChapter, { resetOnSuccess: true });
  const nextPosition = chapters.length ? Math.max(...chapters.map((chapter) => chapter.position)) + 1 : 1;
  return (
    <div className="space-y-4">
      {chapters.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun chapitre pour le moment.</p>
      ) : (
        <ol className="space-y-2">
          {chapters.map((chapter) => (
            <ChapterRow key={chapter.id} chapter={chapter} subjectId={subjectId} />
          ))}
        </ol>
      )}
      <form {...formProps} key={chapters.length} className="space-y-2 rounded-lg bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-700">Ajouter un chapitre</p>
        <FormMessage state={state} />
        <input type="hidden" name="subject_id" value={subjectId} />
        <div className="grid gap-2 sm:grid-cols-[70px_1fr_auto]">
          <label className="sr-only" htmlFor="new-position">Position</label>
          <input id="new-position" name="position" type="number" min={0} defaultValue={nextPosition} className="input" />
          <label className="sr-only" htmlFor="new-title">Titre du chapitre</label>
          <input id="new-title" name="title" required maxLength={200} placeholder="Titre du chapitre" className="input" />
          <SubmitButton pending={pending} pendingLabel="Ajout…">Ajouter</SubmitButton>
        </div>
      </form>
    </div>
  );
}
