import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center", className)}>
      <Icon className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
      <p className="mt-3 font-medium text-slate-700">{title}</p>
      {description ? <div className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-slate-700">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

const BADGE_TONES = {
  brand: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100",
  accent: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-100",
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
} as const;

export function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: keyof typeof BADGE_TONES; className?: string }) {
  return <span className={clsx("badge", BADGE_TONES[tone], className)}>{children}</span>;
}

export function SectionHeader({ title, description, action, id }: { title: string; description?: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white">
      <div className="container-page py-8 sm:py-10">
        {children}
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">{title}</h1>
        {description ? <div className="mt-2 max-w-3xl text-slate-600">{description}</div> : null}
      </div>
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "error" | "success" | "warning"; children: ReactNode }) {
  const styles = {
    info: "border-brand-200 bg-brand-50 text-brand-800",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-accent-100 bg-accent-50 text-accent-700",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={clsx("rounded-lg border px-4 py-3 text-sm", styles)}>
      {children}
    </div>
  );
}
