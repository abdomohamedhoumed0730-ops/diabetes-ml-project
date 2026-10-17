/** Empêche les redirections ouvertes après connexion. */
export function safeNextPath(value: string | null | undefined, fallback = "/espace"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
