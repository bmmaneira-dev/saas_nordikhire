"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { candidateLogin } from "./actions";

export default function CandidateLoginPage() {
  const [state, formAction, pending] = useActionState(candidateLogin, undefined);

  return (
    <AuthShell
      title="Entrar como candidato"
      subtitle="Acede às tuas ferramentas de carreira."
      footer={
        <>
          Ainda não tens conta?{" "}
          <Link
            href="/candidate/signup"
            className="font-medium text-primary underline"
          >
            Criar conta
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Email">
          <Input type="email" name="email" required />
        </Field>
        <Field label="Password">
          <PasswordInput name="password" required />
        </Field>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "A entrar..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
