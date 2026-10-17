import Link from "next/link";
import { GraduationCap, LayoutDashboard, LogIn, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME } from "@/lib/constants";
import { MobileMenu } from "@/components/mobile-menu";
import { signOut } from "@/app/actions/auth";

export const NAV_LINKS = [
  { href: "/formations", label: "Formations" },
  { href: "/matieres", label: "Matières" },
  { href: "/projets", label: "Projets" },
  { href: "/recherche", label: "Recherche" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold text-brand-900" aria-label={`${SITE_NAME} — accueil`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg tracking-tight">
        IAMD <span className="font-normal text-accent-600">Resources</span>
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = user?.profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand-800">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdmin ? (
                <Link href="/admin" className="btn-secondary">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Administration
                </Link>
              ) : null}
              <Link href="/espace" className="btn-secondary" title={user.email ?? undefined}>
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Mon espace
              </Link>
              <form action={signOut}>
                <button type="submit" className="btn text-slate-600 hover:bg-slate-100">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <Link href="/connexion" className="btn-primary">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Connexion
            </Link>
          )}
        </div>
        <MobileMenu links={NAV_LINKS} isAuthenticated={Boolean(user)} isAdmin={isAdmin} signOutAction={signOut} />
      </div>
    </header>
  );
}
