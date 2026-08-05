"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendInterviewMessage } from "../actions";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function InterviewChat({
  interviewId,
  dict,
}: {
  interviewId: string;
  dict: Dictionary;
}) {
  const boundAction = sendInterviewMessage.bind(null, interviewId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const t = dict.interviewPage;

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <Textarea
        name="message"
        rows={3}
        required
        placeholder={t.chatPlaceholder}
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t.sending : t.sendAnswer}
      </Button>
    </form>
  );
}
