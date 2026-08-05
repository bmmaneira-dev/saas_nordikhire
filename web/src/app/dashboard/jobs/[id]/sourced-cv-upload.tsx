"use client";

import { useState } from "react";
import { uploadSourcedCv } from "./actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

interface FileResult {
  fileName: string;
  status: "pending" | "processing" | "success" | "skipped" | "error";
  candidateName?: string;
  score?: number;
  message?: string;
}

const MAX_FILES = 15;

export function SourcedCvUpload({ jobId, dict }: { jobId: string; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);
  const [running, setRunning] = useState(false);
  const t = dict.sourcedCvUpload;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, MAX_FILES);

    setRunning(true);
    setResults(
      files.map((f) => ({ fileName: f.name, status: "pending" as const }))
    );

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "processing" } : r))
      );

      const formData = new FormData();
      formData.set("cv", file);
      const result = await uploadSourcedCv(jobId, formData);

      setResults((prev) =>
        prev.map((r, idx) => {
          if (idx !== i) return r;
          if (result.success) {
            return {
              ...r,
              status: "success",
              candidateName: result.candidateName,
              score: result.score,
            };
          }
          if (result.skipped) {
            return {
              ...r,
              status: "skipped",
              candidateName: result.candidateName,
              message: result.reason,
            };
          }
          return { ...r, status: "error", message: result.error };
        })
      );
    }

    setRunning(false);
  }

  return (
    <details
      className="mt-4"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none text-sm font-medium text-primary underline">
        {t.uploadCvs}
      </summary>
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-muted p-4">
        <p className="text-xs text-muted-foreground">
          {t.description} {t.maxFilesBefore} {MAX_FILES} {t.maxFilesAfter}
        </p>
        <input
          type="file"
          accept="application/pdf"
          multiple
          disabled={running}
          onChange={(e) => handleFiles(e.target.files)}
          className="text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
        />

        {results.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {results.map((r, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-foreground">
                  {r.fileName}
                </span>{" "}
                {r.status === "pending" && (
                  <span className="text-muted-foreground">{t.statusQueued}</span>
                )}
                {r.status === "processing" && (
                  <span className="text-primary">{t.statusProcessing}</span>
                )}
                {r.status === "success" && (
                  <span className="text-success">
                    ✓ {r.candidateName} — {t.scoreLabel} {r.score}
                  </span>
                )}
                {r.status === "skipped" && (
                  <span className="text-warning">
                    ⚠ {r.candidateName} — {r.message}
                  </span>
                )}
                {r.status === "error" && (
                  <span className="text-danger">✗ {r.message}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {running && (
          <Button type="button" variant="secondary" size="sm" disabled className="self-start">
            {t.processingCvs}
          </Button>
        )}
      </div>
    </details>
  );
}
