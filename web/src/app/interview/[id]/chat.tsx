"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendInterviewMessage } from "../actions";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function InterviewChat({ interviewId }: { interviewId: string }) {
  const boundAction = sendInterviewMessage.bind(null, interviewId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

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
        placeholder="Escreve a tua resposta..."
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "A enviar..." : "Enviar resposta"}
      </Button>
    </form>
  );
}
