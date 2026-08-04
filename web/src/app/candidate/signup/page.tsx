"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { candidateSignup } from "./actions";

export default function CandidateSignupPage() {
  const [state, formAction, pending] = useActionState(candidateSignup, undefined);

  return (
    <AuthShell
      title="Criar conta de candidato"
      subtitle="Acede às ferramentas de carreira do NordikHire — independente de qualquer candidatura."
      variant="candidate"
      footer={
        <>
          Já tens conta?{" "}
          <Link
            href="/candidate/login"
            className="font-medium text-primary underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="O teu nome">
          <Input type="text" name="fullName" required />
        </Field>
        <Field label="Email">
          <Input type="email" name="email" required />
        </Field>
        <Field label="Password">
          <PasswordInput name="password" required minLength={8} />
        </Field>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            Aceito o tratamento dos meus dados pessoais conforme a Política de
            Protecção de Dados.
          </span>
        </label>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "A criar..." : "Criar conta"}
        </Button>
      </form>
    </AuthShell>
  );
}
