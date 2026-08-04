"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { signup } from "./actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <AuthShell
      title="Criar conta da empresa"
      subtitle="Cria a tua empresa no NordikHire e começa a publicar vagas."
      footer={
        <>
          Já tens conta?{" "}
          <Link href="/login" className="font-medium text-primary underline">
            Entrar
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Nome da empresa">
          <Input type="text" name="companyName" required />
        </Field>
        <Field label="O teu nome">
          <Input type="text" name="fullName" required />
        </Field>
        <Field label="Email">
          <Input type="email" name="email" required />
        </Field>
        <Field label="Password">
          <Input type="password" name="password" required minLength={8} />
        </Field>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "A criar..." : "Criar conta"}
        </Button>
      </form>
    </AuthShell>
  );
}
