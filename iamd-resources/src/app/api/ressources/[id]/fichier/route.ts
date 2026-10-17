import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getResource, getSignedFileUrl, logEvent } from "@/lib/queries";

/**
 * Téléchargement d'un document : vérifie l'accès (règles RLS), enregistre la
 * statistique puis redirige vers une URL signée de courte durée.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/ressources/[id]/fichier">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  const resource = await getResource(id);
  if (!resource) {
    return NextResponse.json({ error: "Document introuvable ou non publié." }, { status: 404 });
  }

  let target: string | null;
  if (resource.external_url) {
    target = resource.external_url;
  } else {
    target = await getSignedFileUrl(resource.file_path!, { download: resource.file_name ?? "document", expiresIn: 60 });
    if (!target) {
      return NextResponse.json({ error: "Le fichier est momentanément indisponible." }, { status: 503 });
    }
  }

  await logEvent("download", { resourceId: resource.id });

  const response = NextResponse.redirect(target, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
