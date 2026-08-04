"use client";

import { useActionState } from "react";
import { applyToJob } from "./actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ApplyForm({
  jobId,
  companyId,
}: {
  jobId: string;
  companyId: string;
}) {
  const boundAction = applyToJob.bind(null, jobId, companyId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  if (state?.success) {
    return (
      <div className="rounded-xl bg-success-bg px-4 py-6 text-success">
        <p className="font-medium">Candidatura enviada!</p>
        <p className="mt-1 text-sm">
          Vamos rever o teu perfil e entrar em contacto sobre os próximos
          passos.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nome completo">
        <Input type="text" name="fullName" required />
      </Field>
      <Field label="Email">
        <Input type="email" name="email" required />
      </Field>
      <Field label="Telefone">
        <Input type="tel" name="phone" />
      </Field>
      <Field label="CV (PDF)">
        <input
          type="file"
          name="cv"
          accept="application/pdf"
          className="text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
        />
      </Field>

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 accent-primary"
        />
        <span>
          Aceito o tratamento dos meus dados pessoais para efeitos deste
          processo de recrutamento, conforme a Política de Protecção de
          Dados.
        </span>
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "A enviar..." : "Candidatar-me"}
      </Button>
    </form>
  );
}
