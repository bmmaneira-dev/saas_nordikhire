"use client";

import { useActionState } from "react";
import { updateCandidateProfile } from "./actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ProfileForm({
  fullName,
  phone,
  linkedinUrl,
}: {
  fullName: string;
  phone: string;
  linkedinUrl: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCandidateProfile,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nome completo">
        <Input type="text" name="fullName" required defaultValue={fullName} />
      </Field>
      <Field label="Telefone">
        <Input type="tel" name="phone" defaultValue={phone} />
      </Field>
      <Field label="LinkedIn">
        <Input
          type="url"
          name="linkedinUrl"
          defaultValue={linkedinUrl}
          placeholder="https://linkedin.com/in/..."
        />
      </Field>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-success">Perfil actualizado.</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "A guardar..." : "Guardar"}
      </Button>
    </form>
  );
}
