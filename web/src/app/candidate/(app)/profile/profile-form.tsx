"use client";

import { useActionState } from "react";
import { updateCandidateProfile } from "./actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function ProfileForm({
  fullName,
  phone,
  linkedinUrl,
  dict,
}: {
  fullName: string;
  phone: string;
  linkedinUrl: string;
  dict: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(
    updateCandidateProfile,
    undefined
  );
  const t = dict.candidateProfileForm;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label={t.fullName}>
        <Input type="text" name="fullName" required defaultValue={fullName} />
      </Field>
      <Field label={t.phone}>
        <Input type="tel" name="phone" defaultValue={phone} />
      </Field>
      <Field label={t.linkedin}>
        <Input
          type="url"
          name="linkedinUrl"
          defaultValue={linkedinUrl}
          placeholder="https://linkedin.com/in/..."
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
