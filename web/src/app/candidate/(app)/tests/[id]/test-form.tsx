"use client";

import { useActionState } from "react";
import { submitTestAnswers } from "../actions";
import { Field, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function TestForm({
  assignmentId,
  questions,
  dict,
}: {
  assignmentId: string;
  questions: string[];
  dict: Dictionary;
}) {
  const boundAction = submitTestAnswers.bind(null, assignmentId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const t = dict.candidateTestForm;

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-6">
      {questions.map((question, i) => (
        <Field key={i} label={`${i + 1}. ${question}`}>
          <Textarea name={`answer_${i}`} rows={4} required />
        </Field>
      ))}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t.evaluating : t.submitTest}
      </Button>
    </form>
  );
}
