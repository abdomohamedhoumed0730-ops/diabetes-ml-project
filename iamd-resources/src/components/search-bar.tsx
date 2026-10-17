import { Search } from "lucide-react";
import clsx from "clsx";

/** Formulaire GET : fonctionne même sans JavaScript. */
export function SearchBar({ defaultValue, size = "md", className }: { defaultValue?: string; size?: "md" | "lg"; className?: string }) {
  return (
    <form action="/recherche" method="get" role="search" className={clsx("relative flex w-full", className)}>
      <label htmlFor={`search-${size}`} className="sr-only">
        Rechercher un cours, un document, un projet ou un exercice
      </label>
      <Search
        className={clsx("pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400", size === "lg" ? "left-4 h-5 w-5" : "left-3 h-4 w-4")}
        aria-hidden="true"
      />
      <input
        id={`search-${size}`}
        name="q"
        type="search"
        defaultValue={defaultValue}
        maxLength={120}
        placeholder="Rechercher un cours, un PDF, un projet, un exercice…"
        className={clsx(
          "w-full rounded-l-xl border border-r-0 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none",
          size === "lg" ? "py-3.5 pr-4 pl-12 text-base" : "py-2 pr-3 pl-9 text-sm",
        )}
      />
      <button
        type="submit"
        className={clsx(
          "rounded-r-xl bg-accent-600 font-medium text-white transition-colors hover:bg-accent-700",
          size === "lg" ? "px-4 text-base sm:px-6" : "px-4 text-sm",
        )}
      >
        Rechercher
      </button>
    </form>
  );
}
