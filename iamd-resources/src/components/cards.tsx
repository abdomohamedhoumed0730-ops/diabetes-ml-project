import Link from "next/link";
import { ArrowRight, Calendar, Download, Eye, Layers } from "lucide-react";
import { FileIcon, SubjectIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import {
  DIFFICULTY_LABELS,
  PROJECT_CATEGORY_LABELS,
  RESOURCE_TYPE_LABELS,
  type Difficulty,
  type ProjectCategory,
  type ResourceType,
} from "@/lib/constants";
import { formatBytes } from "@/lib/files";
import { formatDate } from "@/lib/format";

export type SubjectCardData = {
  slug: string;
  name: string;
  short_description: string | null;
  icon: string;
  is_published?: boolean;
  resources?: { count: number }[];
  level?: { name: string } | null;
  semester?: { name: string } | null;
};

export function SubjectCard({ subject }: { subject: SubjectCardData }) {
  const count = subject.resources?.[0]?.count ?? 0;
  return (
    <Link href={`/matieres/${subject.slug}`} className="card-hover group flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-100">
          <SubjectIcon name={subject.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug text-brand-950 group-hover:text-brand-700">{subject.name}</h3>
          {subject.level || subject.semester ? (
            <p className="mt-0.5 text-xs text-slate-500">
              {[subject.level?.name, subject.semester?.name].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
      {subject.short_description ? <p className="mt-3 line-clamp-3 text-sm text-slate-600">{subject.short_description}</p> : null}
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {count === 0 ? "Aucune ressource" : `${count} ressource${count > 1 ? "s" : ""}`}
        </span>
        {subject.is_published === false ? <Badge tone="amber">Non publiée</Badge> : null}
        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
      </div>
    </Link>
  );
}

export type ResourceCardData = {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  file_name: string | null;
  file_size: number | null;
  external_url: string | null;
  source: string;
  created_at: string;
  is_published?: boolean;
  subject?: { name: string; slug: string } | null;
  chapter?: { title: string } | null;
  project?: { title: string; slug: string } | null;
  views?: number;
  downloads?: number;
};

export function ResourceCard({ resource, showSubject = true }: { resource: ResourceCardData; showSubject?: boolean }) {
  const external = Boolean(resource.external_url);
  return (
    <article className="card-hover relative flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <FileIcon fileName={resource.file_name} external={external} className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="brand">{RESOURCE_TYPE_LABELS[resource.type]}</Badge>
            {resource.is_published === false ? <Badge tone="amber">Brouillon</Badge> : null}
          </div>
          <h3 className="mt-1.5 font-medium leading-snug text-slate-900">
            <Link href={`/ressources/${resource.id}`} className="after:absolute after:inset-0 hover:text-brand-700">
              {resource.title}
            </Link>
          </h3>
          {showSubject && (resource.subject || resource.project) ? (
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {resource.subject?.name ?? resource.project?.title}
              {resource.chapter ? ` · ${resource.chapter.title}` : ""}
            </p>
          ) : null}
        </div>
      </div>
      {resource.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{resource.description}</p> : null}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDate(resource.created_at)}
        </span>
        {resource.file_size ? <span>{formatBytes(resource.file_size)}</span> : null}
        {external ? <span>Lien externe</span> : null}
        {resource.views !== undefined ? (
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {resource.views}
          </span>
        ) : null}
        {resource.downloads !== undefined ? (
          <span className="inline-flex items-center gap-1">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {resource.downloads}
          </span>
        ) : null}
      </div>
      <p className="mt-1 truncate text-xs text-slate-400">Source : {resource.source}</p>
    </article>
  );
}

export type ProjectCardData = {
  slug: string;
  title: string;
  summary: string | null;
  category: ProjectCategory;
  difficulty: Difficulty;
  technologies: string[];
  is_example: boolean;
  is_published?: boolean;
  subject?: { name: string } | null;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link href={`/projets/${project.slug}`} className="card-hover group flex h-full flex-col p-5">
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="accent">{PROJECT_CATEGORY_LABELS[project.category]}</Badge>
        <Badge>{DIFFICULTY_LABELS[project.difficulty]}</Badge>
        {project.is_example ? <Badge tone="amber">Exemple fictif</Badge> : null}
        {project.is_published === false ? <Badge tone="amber">Brouillon</Badge> : null}
      </div>
      <h3 className="mt-3 font-semibold leading-snug text-brand-950 group-hover:text-brand-700">{project.title}</h3>
      {project.subject ? <p className="mt-0.5 text-xs text-slate-500">{project.subject.name}</p> : null}
      {project.summary ? <p className="mt-2 line-clamp-3 text-sm text-slate-600">{project.summary}</p> : null}
      {project.technologies.length ? (
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-4" aria-label="Technologies">
          {project.technologies.slice(0, 5).map((tech) => (
            <li key={tech} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
              {tech}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
}
