import { useState, useRef } from "react";
import { Monitor, RefreshCw, ExternalLink, Smartphone, Tablet } from "lucide-react";

const PAGES = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/produtos" },
  { label: "Promoções", href: "/promocoes" },
  { label: "Pesquisa", href: "/pesquisa" },
  { label: "Carrinho", href: "/carrinho" },
  { label: "Conta", href: "/conta" }
];

const VIEWPORTS = [
  { label: "Desktop", icon: Monitor, width: "100%", minW: "900px" },
  { label: "Tablet", icon: Tablet, width: "768px", minW: "768px" },
  { label: "Mobile", icon: Smartphone, width: "390px", minW: "390px" }
];

const FO_BASE = import.meta.env.VITE_FO_BASE_URL || "http://localhost:5173";

export const PreviewPage = () => {
  const [currentPage, setCurrentPage] = useState("/");
  const [viewport, setViewport] = useState(0);
  const [key, setKey] = useState(0);
  const iframeRef = useRef(null);

  const src = `${FO_BASE}${currentPage}`;
  const vp = VIEWPORTS[viewport];

  const refresh = () => setKey((k) => k + 1);

  return (
    <div className="-m-4 md:-m-6" style={{ height: "calc(100vh - 4rem)", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        {/* Page nav */}
        <div className="flex gap-1 flex-wrap">
          {PAGES.map(({ label, href }) => (
            <button
              key={href}
              onClick={() => setCurrentPage(href)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                currentPage === href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Viewport selector */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          {VIEWPORTS.map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              title={label}
              onClick={() => setViewport(i)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewport === i ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={refresh}
          title="Recarregar"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir em nova aba"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Iframe area */}
      <div className="flex-1 overflow-auto bg-slate-200 flex items-start justify-center p-4">
        <div
          style={{
            width: vp.width,
            minWidth: vp.minW,
            height: "100%",
            transition: "width 0.3s ease",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            borderRadius: "8px",
            overflow: "hidden",
            background: "#fff"
          }}
        >
          <iframe
            key={key}
            ref={iframeRef}
            src={src}
            title="Pré-visualização do site"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
};
