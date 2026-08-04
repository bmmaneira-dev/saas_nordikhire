"use client";

import { useActionState } from "react";
import { acceptInvite } from "./actions";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function InviteAcceptForm({
  token,
  email,
  defaultFullName,
}: {
  token: string;
  email: string;
  defaultFullName: string;
}) {
  const boundAction = acceptInvite.bind(null, token);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email">
        <Input type="email" defaultValue={email} disabled />
      </Field>
      <Field label="O teu nome">
        <Input
          type="text"
          name="fullName"
          required
          defaultValue={defaultFullName}
        />
      </Field>
      <Field label="Password">
        <PasswordInput name="password" required minLength={8} />
      </Field>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "A juntar-te..." : "Juntar-me à equipa"}
      </Button>
    </form>
  );
}
