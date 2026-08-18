import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "border border-surface-border bg-surface text-foreground hover:bg-surface-muted",
  ghost: "text-muted-foreground hover:text-foreground",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className = ""
) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  target?: string;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  target,
}: ButtonLinkProps) {
  return (
    <Link href={href} target={target} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
