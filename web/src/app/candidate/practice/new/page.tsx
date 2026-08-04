"use client";

import Link from "next/link";
import { useActionState } from "react";
import { startPractice } from "../actions";
import { PageHeader } from "@/components/page-header";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function NewPracticePage() {
  const [state, formAction, pending] = useActionState(startPractice, undefined);

  return (
    <>
      <PageHeader href="/candidate/dashboard" />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-12">
        <Link
          href="/candidate/dashboard"
          className="text-sm text-muted-foreground underline"
        >
          ← Voltar
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Praticar entrevista
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Descreve o cargo que queres treinar e a IA conduz uma entrevista
          simulada, com uma avaliação no final.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <Field label="Cargo-alvo">
            <Input
              type="text"
              name="targetRole"
              required
              placeholder="Ex: Engenheira de Software Backend"
            />
          </Field>
          <Field label="Notas / foco (opcional)">
            <Textarea
              name="notes"
              rows={4}
              placeholder="Ex: quero focar em perguntas de sistemas distribuídos e liderança técnica"
            />
          </Field>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? "A preparar..." : "Começar entrevista de prática"}
          </Button>
        </form>
      </main>
    </>
  );
}
