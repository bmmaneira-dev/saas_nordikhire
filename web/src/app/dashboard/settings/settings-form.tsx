"use client";

import { useActionState } from "react";
import { updateCompanyProfile } from "./actions";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

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
  dict,
}: {
  name: string;
  industry: string;
  country: string;
  logoUrl: string;
  dict: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanyProfile,
    undefined
  );
  const t = dict.settingsForm;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label={t.companyName}>
        <Input type="text" name="name" required defaultValue={name} />
      </Field>
      <Field label={t.industry}>
        <Select name="industry" defaultValue={industry}>
          <option value="">—</option>
          {INDUSTRIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.country}>
        <Input
          type="text"
          name="country"
          defaultValue={country}
          maxLength={2}
          placeholder="AO"
        />
      </Field>
      <Field label={t.logoUrl}>
        <Input
          type="url"
          name="logoUrl"
          defaultValue={logoUrl}
          placeholder="https://..."
        />
      </Field>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-success">{t.updated}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? t.saving : t.save}
      </Button>
    </form>
  );
}
