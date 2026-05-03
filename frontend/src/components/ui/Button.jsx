import clsx from "clsx";

export const Button = ({ as: Component = "button", className, variant = "primary", ...props }) => (
  <Component
    className={clsx(
      variant === "primary" ? "button-primary" : "button-secondary",
      className
    )}
    {...props}
  />
);
