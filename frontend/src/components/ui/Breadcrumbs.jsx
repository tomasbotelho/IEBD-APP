import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export const Breadcrumbs = ({ items }) => (
  <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
    <ol className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <li key={item.label} className="flex items-center gap-2">
          {index > 0 ? <ChevronRight className="h-4 w-4" /> : null}
          {item.href ? (
            <Link className="transition hover:text-pine-600" to={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink-900">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
