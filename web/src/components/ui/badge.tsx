import type { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const variants: Record<BadgeVariant, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-surface-muted text-muted-foreground",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide uppercase ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// Mapeia os vários estados usados no schema (vagas, candidaturas,
// entrevistas) para uma cor de badge consistente em toda a app.
const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  open: "success",
  scored: "info",
  completed: "success",
  received: "neutral",
  draft: "neutral",
  closed: "danger",
  rejected: "danger",
  paused: "warning",
  in_progress: "warning",
  scheduled: "warning",
  screening: "neutral",
  shortlisted: "info",
  interview: "warning",
  test: "warning",
  offer: "success",
  hired: "success",
  withdrawn: "neutral",
};

export function statusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] ?? "neutral";
}
