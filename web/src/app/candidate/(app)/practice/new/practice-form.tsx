"use client";

import Link from "next/link";
import { useActionState } from "react";
import { startPractice } from "../actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function PracticeForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(startPractice, undefined);
  const t = dict.candidatePracticeNew;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
        <Link
          href="/candidate/practice"
          className="text-sm text-muted-foreground underline"
        >
          {t.back}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.subtitle}
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <Field label={t.fieldTargetRole}>
            <Input
              type="text"
              name="targetRole"
              required
              placeholder={t.targetRolePlaceholder}
            />
          </Field>
          <Field label={t.fieldNotes}>
            <Textarea
              name="notes"
              rows={4}
              placeholder={t.notesPlaceholder}
            />
          </Field>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? t.preparing : t.startPractice}
          </Button>
        </form>
    </div>
  );
}
