"use client";

import Link from "next/link";
import { useActionState } from "react";
import { startOptimization } from "../actions";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function OptimizeForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(
    startOptimization,
    undefined
  );
  const t = dict.candidateOptimizeNew;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
        <Link
          href="/candidate/development"
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
          <Field label={t.fieldSourceType}>
            <Select name="sourceType" defaultValue="linkedin" required>
              <option value="linkedin">{t.sourceLinkedin}</option>
              <option value="cv">{t.sourceCv}</option>
              <option value="other_platform">{t.sourceOtherPlatform}</option>
            </Select>
          </Field>
          <Field label={t.fieldSourceLabel}>
            <Input
              type="text"
              name="sourceLabel"
              placeholder={t.sourceLabelPlaceholder}
            />
          </Field>
          <Field label={t.fieldInputText}>
            <Textarea
              name="inputText"
              rows={12}
              required
              placeholder={t.inputTextPlaceholder}
            />
          </Field>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? t.analyzing : t.analyzeAndImprove}
          </Button>
        </form>
    </div>
  );
}
