"use client";

import { useState } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldClass =
  "rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      {label}
      {children}
    </label>
  );
}

export function Input({
  className = "",
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} className={`${fieldClass} ${className}`} />;
}

export function PasswordInput({
  className = "",
  ref,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  ref?: Ref<HTMLInputElement>;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        {...props}
        className={`${fieldClass} w-full pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Ocultar password" : "Mostrar password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {visible ? "Ocultar" : "Ver"}
      </button>
    </div>
  );
}

export function Textarea({
  className = "",
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
}) {
  return (
    <textarea ref={ref} {...props} className={`${fieldClass} ${className}`} />
  );
}

export function Select({
  className = "",
  ref,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return <select ref={ref} {...props} className={`${fieldClass} ${className}`} />;
}
