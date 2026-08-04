"use client";

import { useActionState, useRef, useEffect } from "react";
import { inviteTeammate } from "./actions";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function InviteForm({
  roles,
}: {
  roles: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(inviteTeammate, undefined);
  const formRef = useRef<HTMLFormElement>(null);

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
        <Field label="Email">
          <Input type="email" name="email" required placeholder="colega@empresa.com" />
        </Field>
      </div>
      <div className="flex-1">
        <Field label="Nome (opcional)">
          <Input type="text" name="fullName" />
        </Field>
      </div>
      <div>
        <Field label="Papel">
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
        {pending ? "A convidar..." : "Convidar"}
      </Button>
      {state?.error && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      {state?.success && (
        <p className="w-full text-sm text-success">
          Convite criado — copia o link abaixo e envia ao colega.
        </p>
      )}
    </form>
  );
}
