"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileMenu({
  links,
  isAuthenticated,
  isAdmin,
  signOutAction,
}: {
  links: { href: string; label: string }[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le menu après une navigation.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-16 border-b border-slate-200 bg-white shadow-lg">
          <nav aria-label="Navigation mobile" className="container-page flex flex-col gap-1 py-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-100">
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-slate-200" />
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Link href="/admin" className="rounded-md px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-100">
                    Administration
                  </Link>
                ) : null}
                <Link href="/espace" className="rounded-md px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-100">
                  Mon espace
                </Link>
                <form action={signOutAction}>
                  <button type="submit" className="w-full rounded-md px-3 py-2.5 text-left font-medium text-slate-700 hover:bg-slate-100">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <Link href="/connexion" className="btn-primary mt-1">
                Connexion
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
