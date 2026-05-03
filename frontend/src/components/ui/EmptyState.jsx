import { Button } from "./Button.jsx";

export const EmptyState = ({ title, description, action }) => (
  <div className="surface-card flex flex-col items-center gap-4 px-6 py-12 text-center">
    <div className="rounded-full bg-sand-50 p-4 text-3xl">🛒</div>
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="max-w-xl text-sm text-slate-600">{description}</p>
    {action ? <Button as="a" href={action.href}>{action.label}</Button> : null}
  </div>
);
