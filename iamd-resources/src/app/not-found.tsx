import Link from "next/link";
import { SearchX } from "lucide-react";
import { SearchBar } from "@/components/search-bar";

export default function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <SearchX className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-brand-950">Page introuvable</h1>
      <p className="mx-auto mt-2 max-w-lg text-slate-600">
        Cette page n&apos;existe pas, a été déplacée ou n&apos;est pas (encore) publiée.
      </p>
      <div className="mx-auto mt-6 max-w-xl">
        <SearchBar />
      </div>
      <Link href="/" className="btn-secondary mt-6">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
