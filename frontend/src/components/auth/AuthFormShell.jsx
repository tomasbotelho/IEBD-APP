export const AuthFormShell = ({ title, description, children, aside }) => {
  const hasAside = Boolean(aside);

  return (
    <section className="container-shell py-10 md:py-16">
      <div
        className={
          hasAside
            ? "grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            : "mx-auto max-w-[640px]"
        }
      >
        <div className="surface-card p-6 sm:p-8 lg:p-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          {description ? <p className="mt-3 text-sm text-slate-600">{description}</p> : null}
          <div className={description ? "mt-8" : "mt-6"}>{children}</div>
        </div>
        {hasAside ? <div className="rounded-[2rem] bg-hero-grid p-8">{aside}</div> : null}
      </div>
    </section>
  );
};
