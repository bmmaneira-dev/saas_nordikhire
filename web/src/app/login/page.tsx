"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <AuthShell
      title="Entrar no NordikHire"
      subtitle="Acede ao dashboard da tua empresa."
      footer={
        <>
          Ainda não tens conta?{" "}
          <Link href="/signup" className="font-medium text-primary underline">
            Criar conta da empresa
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Email">
          <Input type="email" name="email" required />
        </Field>
        <Field label="Password">
          <Input type="password" name="password" required />
        </Field>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "A entrar..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
