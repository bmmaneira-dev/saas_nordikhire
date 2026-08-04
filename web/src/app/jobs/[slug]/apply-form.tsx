"use client";

import { useActionState, useState } from "react";
import { applyToJob, createVideoUploadTicket } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const VIDEO_BUCKET = "application-videos";
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

type VideoStatus =
  | { state: "idle" }
  | { state: "uploading"; fileName: string }
  | { state: "done"; fileName: string; path: string }
  | { state: "error"; message: string };

export function ApplyForm({
  jobId,
  companyId,
}: {
  jobId: string;
  companyId: string;
}) {
  const boundAction = applyToJob.bind(null, jobId, companyId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [video, setVideo] = useState<VideoStatus>({ state: "idle" });

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setVideo({ state: "idle" });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setVideo({
        state: "error",
        message: "O vídeo não pode exceder 50MB.",
      });
      e.target.value = "";
      return;
    }

    setVideo({ state: "uploading", fileName: file.name });

    const ticket = await createVideoUploadTicket(jobId, companyId, file.name);
    if ("error" in ticket) {
      setVideo({ state: "error", message: ticket.error! });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .uploadToSignedUrl(ticket.path!, ticket.token!, file, {
        contentType: file.type || "video/mp4",
      });

    if (error) {
      setVideo({ state: "error", message: "Erro ao enviar o vídeo: " + error.message });
      return;
    }

    setVideo({ state: "done", fileName: file.name, path: ticket.path! });
  }

  if (state?.success) {
    return (
      <div className="rounded-xl bg-success-bg px-4 py-6 text-success">
        <p className="font-medium">Candidatura enviada!</p>
        <p className="mt-1 text-sm">
          Vamos rever o teu perfil e entrar em contacto sobre os próximos
          passos.
        </p>
      </div>
    );
  }

  const videoUploading = video.state === "uploading";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nome completo">
        <Input type="text" name="fullName" required />
      </Field>
      <Field label="Email">
        <Input type="email" name="email" required />
      </Field>
      <Field label="Telefone">
        <Input type="tel" name="phone" />
      </Field>
      <Field label="CV (PDF)">
        <input
          type="file"
          name="cv"
          accept="application/pdf"
          className="text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
        />
      </Field>
      <Field label="Vídeo de apresentação (opcional)">
        <input
          type="file"
          name="videoFile"
          accept="video/*"
          onChange={handleVideoChange}
          className="text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Grava uma breve apresentação (até 50MB) a explicar porque és a
          pessoa certa para esta vaga.
        </p>
        {video.state === "uploading" && (
          <p className="text-xs text-primary">A enviar &quot;{video.fileName}&quot;...</p>
        )}
        {video.state === "done" && (
          <p className="text-xs text-success">
            Vídeo &quot;{video.fileName}&quot; enviado ✓
          </p>
        )}
        {video.state === "error" && (
          <p className="text-xs text-danger">{video.message}</p>
        )}
      </Field>
      <input type="hidden" name="videoUrl" value={video.state === "done" ? video.path : ""} />

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 accent-primary"
        />
        <span>
          Aceito o tratamento dos meus dados pessoais para efeitos deste
          processo de recrutamento, conforme a Política de Protecção de
          Dados.
        </span>
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button
        type="submit"
        disabled={pending || videoUploading}
        className="mt-2 self-start"
      >
        {pending ? "A enviar..." : videoUploading ? "A enviar vídeo..." : "Candidatar-me"}
      </Button>
    </form>
  );
}
