export const SectionHeading = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="space-y-3">
      {eyebrow ? (
        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-600">
          {eyebrow}
        </span>
      ) : null}
      <div className="space-y-3">
        <h2 className="font-display text-4xl uppercase leading-none text-ink-900 md:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-zinc-600 md:text-base">{description}</p>
        ) : null}
      </div>
    </div>
    {action}
  </div>
);
