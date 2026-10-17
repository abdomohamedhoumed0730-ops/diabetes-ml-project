import { Star } from "lucide-react";
import clsx from "clsx";
import { toggleFavorite } from "@/app/actions/favorites";
import { SubmitButton } from "@/components/submit-button";

export function FavoriteButton({
  active,
  resourceId,
  projectId,
  path,
}: {
  active: boolean;
  resourceId?: string;
  projectId?: string;
  path: string;
}) {
  return (
    <form action={toggleFavorite}>
      {resourceId ? <input type="hidden" name="resource_id" value={resourceId} /> : null}
      {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
      <input type="hidden" name="path" value={path} />
      <SubmitButton className={clsx("btn-secondary", active && "border-amber-300 bg-amber-50 text-amber-800")} pendingLabel="…">
        <Star className={clsx("h-4 w-4", active && "fill-amber-400 text-amber-500")} aria-hidden="true" />
        {active ? "Retirer des favoris" : "Ajouter aux favoris"}
      </SubmitButton>
    </form>
  );
}
