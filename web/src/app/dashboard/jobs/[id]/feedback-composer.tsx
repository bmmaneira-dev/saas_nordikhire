"use client";

import { useState, useTransition } from "react";
import { generateFeedbackDraft } from "./actions";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function FeedbackComposer({
  applicationId,
  jobId,
  draftType,
  formAction,
  required,
  placeholder,
  submitLabel,
  submitVariant,
  dict,
}: {
  applicationId: string;
  jobId: string;
  draftType: "rejection" | "general";
  formAction: (formData: FormData) => void;
  required?: boolean;
  placeholder: string;
  submitLabel: string;
  submitVariant: "danger" | "secondary";
  dict: Dictionary;
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = dict.feedbackComposer;

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateFeedbackDraft(applicationId, jobId, draftType);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("message" in result && result.message) {
        setText(result.message);
      }
    });
  }

  return (
    <form action={formAction} className="mt-2 flex max-w-sm flex-col gap-2">
      <Textarea
        name="feedback"
        rows={3}
        required={required}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleGenerate}
        disabled={pending}
        className="self-start"
      >
        {pending ? t.generating : t.generateDraftAi}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button type="submit" variant={submitVariant} size="sm" className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
