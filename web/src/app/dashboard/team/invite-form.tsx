"use client";

import { useActionState, useRef, useEffect } from "react";
import { inviteTeammate } from "./actions";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function InviteForm({
  roles,
  dict,
}: {
  roles: { id: string; name: string }[];
  dict: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(inviteTeammate, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const t = dict.inviteForm;

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3"
    >
      <div className="flex-1">
        <Field label={t.email}>
          <Input type="email" name="email" required placeholder={t.emailPlaceholder} />
        </Field>
      </div>
      <div className="flex-1">
        <Field label={t.fullName}>
          <Input type="text" name="fullName" />
        </Field>
      </div>
      <div>
        <Field label={t.role}>
          <Select name="roleId" defaultValue={roles.find((r) => r.name === "Recrutador")?.id}>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Button type="submit" disabled={pending} className="shrink-0">
        {pending ? t.inviting : t.invite}
      </Button>
      {state?.error && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      {state?.success && (
        <p className="w-full text-sm text-success">
          {t.successMessage}
        </p>
      )}
    </form>
  );
}
