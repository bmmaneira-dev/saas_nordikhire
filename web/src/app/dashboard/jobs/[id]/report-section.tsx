"use client";

import { useState, useTransition } from "react";
import { generateReport } from "./actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

interface TrainingRecommendationRow {
  gap: string;
  suggested_topic: string;
  resource_type: string;
}

interface DevReportRow {
  strengths: string[] | null;
  technical_gaps: string[] | null;
  behavioral_gaps: string[] | null;
  training_recommendations: TrainingRecommendationRow[] | null;
  overall_summary: string | null;
}

export function ReportSection({
  applicationId,
  jobId,
  devReport,
  hasEvaluationData,
  dict,
}: {
  applicationId: string;
  jobId: string;
  devReport: DevReportRow | null | undefined;
  hasEvaluationData: boolean;
  dict: Dictionary;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = dict.reportSection;

  function handleGenerate() {
    setFailed(false);
    startTransition(async () => {
      try {
        await generateReport(applicationId, jobId);
        setOpen(true);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="mt-3 border-t border-surface-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t.title}
        </p>
        {hasEvaluationData ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={pending}
          >
            {pending ? t.generating : devReport ? t.update : t.generateReport}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{t.notEnoughData}</span>
        )}
      </div>
      {!hasEvaluationData && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t.notEnoughDataHint}
        </p>
      )}
      {failed && (
        <p className="mt-1 text-xs text-danger">
          {t.generateError}
        </p>
      )}
      {devReport && (
        <details
          className="mt-1"
          open={open}
          onToggle={(e) => setOpen(e.currentTarget.open)}
        >
          <summary className="cursor-pointer list-none text-xs font-medium text-primary underline">
            {t.viewReport}
          </summary>
          {devReport.overall_summary && (
            <p className="mt-2 text-sm text-foreground/90">
              {devReport.overall_summary}
            </p>
          )}
          {(devReport.strengths?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-success">{t.strengths}</p>
              <ul className="mt-1 flex flex-col gap-0.5 text-sm text-foreground/90">
                {devReport.strengths!.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {(devReport.technical_gaps?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-warning">{t.technicalGaps}</p>
              <ul className="mt-1 flex flex-col gap-0.5 text-sm text-foreground/90">
                {devReport.technical_gaps!.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {(devReport.behavioral_gaps?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-warning">
                {t.behavioralGaps}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5 text-sm text-foreground/90">
                {devReport.behavioral_gaps!.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {(devReport.training_recommendations?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-primary">
                {t.trainingRecommendations}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5 text-sm text-foreground/90">
                {devReport.training_recommendations!.map((r, i) => (
                  <li key={i}>
                    • {r.suggested_topic} ({r.resource_type}) — {r.gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </details>
      )}
    </div>
  );
}
