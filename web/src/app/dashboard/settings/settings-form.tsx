"use client";

import { useActionState } from "react";
import { updateCompanyProfile } from "./actions";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const INDUSTRIES = [
  "Tecnologia",
  "Banca e Finanças",
  "Telecomunicações",
  "Energia e Recursos",
  "Retalho e Consumo",
  "Saúde",
  "Educação",
  "Construção e Imobiliário",
  "Logística e Transportes",
  "Outra",
];

export function SettingsForm({
  name,
  industry,
  country,
  logoUrl,
}: {
  name: string;
  industry: string;
  country: string;
  logoUrl: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanyProfile,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nome da empresa">
        <Input type="text" name="name" required defaultValue={name} />
      </Field>
      <Field label="Sector de actividade">
        <Select name="industry" defaultValue={industry}>
          <option value="">—</option>
          {INDUSTRIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="País (código ISO)">
        <Input
          type="text"
          name="country"
          defaultValue={country}
          maxLength={2}
          placeholder="AO"
        />
      </Field>
      <Field label="URL do logótipo (opcional)">
        <Input
          type="url"
          name="logoUrl"
          defaultValue={logoUrl}
          placeholder="https://..."
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
