"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "./actions";

export default function CandidateForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    undefined
  );

  if (state?.success) {
    return (
      <AuthShell
        title="Verifica o teu email"
        subtitle="Se existir uma conta com esse email, enviámos um link para repor a password."
        variant="candidate"
        footer={
          <Link
            href="/candidate/login"
            className="font-medium text-primary underline"
          >
            ← Voltar ao login
          </Link>
        }
      >
        <div className="rounded-xl bg-success-bg px-4 py-6 text-sm text-success">
          O link expira em 1 hora. Se não vires o email em alguns minutos,
          confere a pasta de spam.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Esqueceste-te da password?"
      subtitle="Indica o teu email e enviamos-te um link para a repores."
      variant="candidate"
      footer={
        <Link
          href="/candidate/login"
          className="font-medium text-primary underline"
        >
          ← Voltar ao login
        </Link>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Email">
          <Input type="email" name="email" required />
        </Field>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "A enviar..." : "Enviar link de reposição"}
        </Button>
      </form>
    </AuthShell>
  );
}
