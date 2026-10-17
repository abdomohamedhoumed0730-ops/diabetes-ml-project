import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, BookOpen, FileText, FolderKanban, Network, Users } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Administration" }, robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: BarChart3 },
  { href: "/admin/ressources", label: "Ressources", icon: FileText },
  { href: "/admin/matieres", label: "Matières", icon: BookOpen },
  { href: "/admin/projets", label: "Projets", icon: FolderKanban },
  { href: "/admin/taxonomie", label: "Formations et niveaux", icon: Network },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdminPage();
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Administration</p>
        <p className="mt-1 truncate text-sm text-slate-600" title={user.email ?? undefined}>
          {user.profile?.full_name ?? user.email}
        </p>
        <nav aria-label="Navigation administration" className="mt-4">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap text-slate-700 hover:bg-slate-100 hover:text-brand-800">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
