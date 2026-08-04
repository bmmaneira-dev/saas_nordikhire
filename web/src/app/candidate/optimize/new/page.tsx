"use client";

import Link from "next/link";
import { useActionState } from "react";
import { startOptimization } from "../actions";
import { PageHeader } from "@/components/page-header";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function NewOptimizationPage() {
  const [state, formAction, pending] = useActionState(
    startOptimization,
    undefined
  );

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
          Otimizar perfil ou CV
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cola o texto do teu perfil de LinkedIn, CV ou outra plataforma e
          recebe feedback e sugestões de reescrita, secção a secção.
          Ferramenta pessoal — independente de qualquer candidatura ou
          empresa.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <Field label="Tipo de conteúdo">
            <Select name="sourceType" defaultValue="linkedin" required>
              <option value="linkedin">Perfil de LinkedIn</option>
              <option value="cv">CV</option>
              <option value="other_platform">Outra plataforma</option>
            </Select>
          </Field>
          <Field label="Nome da plataforma (opcional)">
            <Input
              type="text"
              name="sourceLabel"
              placeholder="Ex: LinkedIn, Indeed, Portal de Emprego X"
            />
          </Field>
          <Field label="Texto do perfil / CV">
            <Textarea
              name="inputText"
              rows={12}
              required
              placeholder="Cola aqui o texto — headline, resumo, experiência, competências..."
            />
          </Field>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? "A analisar..." : "Analisar e melhorar"}
          </Button>
        </form>
      </main>
    </>
  );
}
