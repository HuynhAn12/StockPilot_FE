import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-(--sp-text-muted)">
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight className="size-3.5" /> : null}
          <span className={index === items.length - 1 ? "font-medium text-(--sp-text)" : ""}>{item}</span>
        </span>
      ))}
    </nav>
  );
}
