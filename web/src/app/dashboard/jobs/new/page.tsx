"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createJob } from "../actions";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function NewJobPage() {
  const [state, formAction, pending] = useActionState(createJob, undefined);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <Link
        href="/dashboard/jobs"
        className="text-sm text-muted-foreground underline"
      >
        ← Voltar às vagas
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Nova vaga
      </h1>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <Field label="Título">
            <Input type="text" name="title" required />
          </Field>

          <Field label="Descrição">
            <Textarea name="description" rows={4} />
          </Field>

          <Field label="Requisitos">
            <Textarea name="requirementsText" rows={4} />
          </Field>

          <Field label="Skills (separadas por vírgula)">
            <Input
              type="text"
              name="skills"
              placeholder="Python, SQL, Excel avançado"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Senioridade">
              <Select name="seniorityLevel">
                <option value="">—</option>
                <option value="junior">Júnior</option>
                <option value="pleno">Pleno</option>
                <option value="senior">Sénior</option>
                <option value="lead">Lead</option>
              </Select>
            </Field>
            <Field label="Modo de trabalho">
              <Select name="workMode">
                <option value="">—</option>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="híbrido">Híbrido</option>
              </Select>
            </Field>
          </div>

          <Field label="Localização">
            <Input type="text" name="location" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Salário mín.">
              <Input type="number" name="salaryMin" />
            </Field>
            <Field label="Salário máx.">
              <Input type="number" name="salaryMax" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="publish"
              defaultChecked
              className="h-4 w-4 accent-primary"
            />
            Publicar já (gera link público)
          </label>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? "A criar..." : "Criar vaga"}
          </Button>
        </form>
    </div>
  );
}
