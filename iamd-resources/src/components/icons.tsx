import {
  BarChart3,
  BookOpen,
  Brain,
  Code2,
  Cpu,
  Database,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Link2,
  MessageSquareText,
  Network,
  NotebookPen,
  Route,
  Sigma,
  Table2,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import { getExtension } from "@/lib/files";

const SUBJECT_ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  database: Database,
  brain: Brain,
  cpu: Cpu,
  network: Network,
  "message-square-text": MessageSquareText,
  sigma: Sigma,
  "trending-down": TrendingDown,
  "bar-chart": BarChart3,
  table: Table2,
  code: Code2,
  route: Route,
  "folder-kanban": FolderKanban,
};

export function SubjectIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SUBJECT_ICON_MAP[name] ?? BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}

export function FileIcon({ fileName, external, className }: { fileName?: string | null; external?: boolean; className?: string }) {
  let Icon: LucideIcon = FileText;
  if (external) Icon = Link2;
  else {
    const ext = getExtension(fileName ?? "");
    if (ext === "zip") Icon = FileArchive;
    else if (ext === "csv" || ext === "xlsx") Icon = FileSpreadsheet;
    else if (ext === "ipynb" || ext === "py" || ext === "r") Icon = NotebookPen;
    else if (["png", "jpg", "jpeg", "webp"].includes(ext)) Icon = FileImage;
  }
  return <Icon className={className} aria-hidden="true" />;
}
