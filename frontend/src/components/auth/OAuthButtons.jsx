import { authService } from "../../services/authService.js";

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
    <path
      d="M21.8 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.94-1.79 3.05-4.43 3.05-7.63Z"
      fill="#4285F4"
    />
    <path
      d="M12 22c2.75 0 5.05-.91 6.73-2.47l-3.3-2.56c-.91.61-2.08.98-3.43.98-2.64 0-4.88-1.78-5.68-4.18H2.9v2.64A10 10 0 0 0 12 22Z"
      fill="#34A853"
    />
    <path
      d="M6.32 13.77A5.98 5.98 0 0 1 6 12c0-.61.11-1.2.32-1.77V7.6H2.9A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.4l3.24-2.63Z"
      fill="#FBBC05"
    />
    <path
      d="M12 6.05c1.5 0 2.85.52 3.91 1.53l2.93-2.93C17.04 2.98 14.74 2 12 2A10 10 0 0 0 2.9 7.6l3.42 2.63c.8-2.4 3.04-4.18 5.68-4.18Z"
      fill="#EA4335"
    />
  </svg>
);

const providers = [
  {
    id: "google",
    label: "Google",
    icon: GoogleIcon
  }
];

export const OAuthButtons = ({ intent = "login", returnTo = "/conta" }) => (
  <div className="space-y-4">
    <div className="grid gap-3">
      {providers.map((provider) => {
        const Icon = provider.icon;

        return (
          <a
            key={provider.id}
            className="flex items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-ink-900 transition hover:border-black hover:bg-zinc-50"
            href={authService.getOAuthStartUrl(provider.id, { intent, returnTo })}
          >
            <Icon />
            <span>
              {intent === "register" ? "Criar conta" : "Continuar"} com {provider.label}
            </span>
          </a>
        );
      })}
    </div>
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-zinc-200" />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">ou</span>
      <div className="h-px flex-1 bg-zinc-200" />
    </div>
  </div>
);
